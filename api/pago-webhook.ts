// api/pago-webhook.ts
// Webhook de Culqi: lo llama Culqi cuando un pago cambia de estado (sobre todo el
// evento "order.status.changed" de PagoEfectivo). Aquí ACREDITAMOS el saldo.
//
// NOTA: hablamos con Supabase por su API REST (PostgREST) vía fetch, SIN el SDK
// @supabase/supabase-js, porque ese paquete falla al cargar en las funciones
// serverless de Vercel (FUNCTION_INVOCATION_FAILED). fetch es nativo y robusto.
//
// SEGURIDAD:
//   - NO confiamos en el contenido del webhook: tomamos solo el id y le PREGUNTAMOS
//     a Culqi el estado real del pago.
//   - Idempotencia: transacciones.referencia_externa es ÚNICA; un mismo pago no
//     acredita saldo dos veces (Culqi puede reintentar el webhook).
//   - Escribimos con la service role (salta RLS); el cliente nunca toca el saldo.

import type { VercelRequest, VercelResponse } from './_types.js'

const CULQI_API = 'https://api.culqi.com/v2'
const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Lee el cuerpo JSON (puede llegar como texto o ya parseado).
function leerBody(body: unknown): Record<string, any> {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }
  return body as Record<string, any>
}

// Llamada a la API REST de Supabase (PostgREST) con la service role.
function supa(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPA_KEY,
      Authorization: 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' })

  try {
    if (!process.env.CULQI_SECRET_KEY || !SUPA_URL || !SUPA_KEY) {
      return res.status(200).json({ ok: false, motivo: 'pagos/BD no configurados' })
    }

    // 0) SEGURIDAD: si hay un secreto de webhook configurado, exigimos que la URL lo
    //    traiga (?token=...). Solo Culqi conoce esa URL secreta (se configura en su
    //    panel), asi que un atacante no puede falsificar pagos contra este endpoint.
    const secretoWebhook = process.env.CULQI_WEBHOOK_SECRET || ''
    if (secretoWebhook) {
      const tokenUrl = typeof req.query?.token === 'string' ? req.query.token : ''
      if (tokenUrl !== secretoWebhook) {
        return res.status(401).json({ ok: false, motivo: 'no autorizado' })
      }
    }

    // 1) Sacamos el OBJETO (orden/cargo) del evento. OJO: según el evento, Culqi manda
    //    el objeto en "data.object" (un objeto) o en "data" (y "data.object" es solo el
    //    TEXTO del tipo, p. ej. "order"). Tomamos el que de verdad sea un objeto.
    const evento = leerBody(req.body)
    const esObjeto = (x: unknown): x is Record<string, any> => x !== null && typeof x === 'object'
    let data: any = evento?.data?.object
    if (!esObjeto(data)) data = evento?.data
    if (!esObjeto(data)) data = evento
    const id: unknown = data?.id
    if (typeof id !== 'string' || !id) {
      return res.status(200).json({ ok: false, motivo: 'evento sin id' })
    }

    // 2) ¿Orden (PagoEfectivo) o cargo (tarjeta/Yape)? Lo dice el prefijo del id.
    const esOrden = id.startsWith('ord_')
    const recurso = esOrden ? 'orders' : 'charges'

    // 3) VERIFICAMOS contra Culqi el estado REAL (no confiamos en el payload).
    // Intentamos RE-CONSULTAR a Culqi (fuente confiable). Para CARGOS (tarjeta/Yape)
    // funciona; para ÓRDENES (PagoEfectivo) la ruta de consulta de Culqi devuelve
    // "ruta inválida", así que usamos el objeto que Culqi ENVIÓ en el evento (este
    // webhook solo lo invoca Culqi hacia la URL registrada).
    let obj: any = data
    let verificadoConCulqi = false
    try {
      const verif = await fetch(`${CULQI_API}/${recurso}/${id}`, {
        headers: { Authorization: 'Bearer ' + process.env.CULQI_SECRET_KEY },
      })
      if (verif.ok) {
        obj = await verif.json()
        verificadoConCulqi = true
      }
    } catch {
      /* no se pudo consultar; se evalua abajo segun el tipo */
    }

    // Los CARGOS (tarjeta/Yape) SI se pueden consultar en Culqi: exigimos esa
    // confirmacion real y nunca confiamos en el objeto que llego en el evento.
    if (!esOrden && !verificadoConCulqi) {
      return res.status(200).json({ ok: false, motivo: 'cargo no verificado con Culqi' })
    }
    // Las ORDENES (PagoEfectivo) no se pueden consultar; solo las aceptamos si el
    // webhook llego autenticado con el token secreto (paso 0). Sin ese token, no
    // arriesgamos a acreditar un evento potencialmente falso.
    if (esOrden && !verificadoConCulqi && !secretoWebhook) {
      return res.status(200).json({ ok: false, motivo: 'orden requiere webhook seguro (token)' })
    }

    // 4) ¿Está realmente pagado?
    const pagado = esOrden
      ? obj?.state === 'paid'
      : obj?.outcome?.type === 'venta_exitosa' || obj?.outcome?.code === 'AUT0000'
    if (!pagado) return res.status(200).json({ ok: true, motivo: 'aún no pagado' })

    // 5) Datos que dejamos en la metadata al crear el pago.
    const meta = obj?.metadata ?? {}
    const usuarioId: string = meta.usuario_id || ''
    const concepto: string = meta.concepto === 'recarga' ? 'recarga' : ''
    const monto = Number(obj?.amount) / 100 // céntimos -> soles
    if (!usuarioId || !concepto || !(monto > 0)) {
      return res.status(200).json({ ok: false, motivo: 'metadata incompleta' })
    }
    // Tope de seguridad por operación (igual que en pago-crear): evita acreditar
    // cifras absurdas si algo se manipulara.
    if (monto > 5000) {
      return res.status(200).json({ ok: false, motivo: 'monto fuera de rango' })
    }

    // 6) IDEMPOTENCIA + ACREDITACIÓN ATÓMICA. PostgreSQL registra la transacción y
    //    suma el saldo dentro de una sola transacción. Si algo falla, revierte ambas.
    const rpc = await supa('rpc/procesar_pago_culqi', {
      method: 'POST',
      body: JSON.stringify({
        p_usuario: usuarioId,
        p_monto: monto,
        p_metodo: esOrden ? 'pagoefectivo' : 'tarjeta',
        p_referencia: id,
      }),
    })
    if (!rpc.ok) {
      // El detalle real solo va a los logs del servidor, nunca en la respuesta publica.
      const detalle = await rpc.text().catch(() => '')
      console.error('Webhook: no se pudo acreditar el pago:', rpc.status, detalle.slice(0, 300))
      return res.status(200).json({ ok: false, motivo: 'no se pudo acreditar' })
    }
    const resultado = await rpc.json().catch(() => null)
    if (resultado?.duplicado) {
      return res.status(200).json({ ok: true, motivo: 'pago ya procesado' })
    }

    return res.status(200).json({ ok: true, acreditado: monto })
  } catch {
    return res.status(200).json({ ok: false, motivo: 'excepción' })
  }
}
