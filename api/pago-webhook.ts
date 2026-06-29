// api/pago-webhook.ts
// Webhook de Culqi: lo llama Culqi cuando un pago cambia de estado (sobre todo el
// evento "order.status.changed" de PagoEfectivo, que es asíncrono: el cliente paga
// el CIP horas después). Aquí ACREDITAMOS el saldo de la billetera.
//
// SEGURIDAD (lo más importante):
//   - NO confiamos en lo que llega en el webhook (podría falsificarse): tomamos solo
//     el id y le PREGUNTAMOS a Culqi el estado real del pago.
//   - Idempotencia: la columna transacciones.referencia_externa es ÚNICA, así que un
//     mismo pago nunca acredita saldo dos veces (Culqi puede reintentar el webhook).
//   - El saldo lo escribe el servidor con la service role (el cliente nunca lo toca).

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseApi, leerBody } from './_supabase'

const CULQI_API = 'https://api.culqi.com/v2'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Culqi envía POST. (Respondemos 200 casi siempre para que no reintente en bucle
  // por errores de datos; solo nos interesa reintentar ante fallos transitorios.)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' })

  try {
    if (!process.env.CULQI_SECRET_KEY || !supabaseApi) {
      return res.status(200).json({ ok: false, motivo: 'pagos/BD no configurados' })
    }

    // 1) Del evento solo nos quedamos con el ID del objeto (orden o cargo).
    const evento = leerBody(req.body)
    const data = evento?.data?.object ?? evento?.data ?? evento
    const id: unknown = data?.id
    if (typeof id !== 'string' || !id) {
      return res.status(200).json({ ok: false, motivo: 'evento sin id' })
    }

    // 2) ¿Orden (PagoEfectivo) o cargo (tarjeta/Yape)? Lo decide el prefijo del id.
    const esOrden = id.startsWith('ord_')
    const recurso = esOrden ? 'orders' : 'charges'

    // 3) VERIFICAMOS contra Culqi el estado REAL (no confiamos en el payload).
    const verif = await fetch(`${CULQI_API}/${recurso}/${id}`, {
      headers: { Authorization: 'Bearer ' + process.env.CULQI_SECRET_KEY },
    })
    if (!verif.ok) return res.status(200).json({ ok: false, motivo: 'no se pudo verificar' })
    const obj = await verif.json()

    // 4) ¿Está realmente pagado?
    //    - Orden (PagoEfectivo): state === 'paid'.
    //    - Cargo (tarjeta/Yape): existe y no fue rechazado (outcome de venta exitosa).
    const pagado = esOrden
      ? obj?.state === 'paid'
      : obj?.outcome?.type === 'venta_exitosa' || obj?.outcome?.code === 'AUT0000'
    if (!pagado) return res.status(200).json({ ok: true, motivo: 'aún no pagado' })

    // 5) Datos que dejamos en la metadata al crear el pago.
    const meta = obj?.metadata ?? {}
    const usuarioId: string = meta.usuario_id || ''
    const concepto: string = meta.concepto === 'compra' ? 'compra' : 'recarga'
    const monto = Number(obj?.amount) / 100 // céntimos -> soles
    if (!usuarioId || !(monto > 0)) {
      return res.status(200).json({ ok: false, motivo: 'metadata incompleta' })
    }

    // 6) IDEMPOTENCIA: registramos la transacción. Si la referencia ya existe
    //    (índice único), significa que ya la procesamos: no acreditamos de nuevo.
    const { error: errIns } = await supabaseApi.from('transacciones').insert({
      usuario_id: usuarioId,
      tipo: concepto === 'recarga' ? 'recarga' : 'compra_directa',
      monto,
      estado: 'aprobado',
      metodo: esOrden ? 'pagoefectivo' : 'tarjeta',
      referencia_externa: id,
    })
    if (errIns) {
      return res.status(200).json({ ok: true, motivo: 'pago ya procesado' })
    }

    // 7) Acreditamos el saldo (solo en recargas). Lectura + suma + guardado.
    //    (Para alta concurrencia conviene una función atómica en Postgres; aquí la
    //     idempotencia del paso 6 ya evita acreditar dos veces el mismo pago.)
    if (concepto === 'recarga') {
      const { data: bil } = await supabaseApi
        .from('billeteras')
        .select('saldo')
        .eq('id', usuarioId)
        .single()
      const saldoActual = Number(bil?.saldo ?? 0)
      const nuevoSaldo = Math.round((saldoActual + monto) * 100) / 100
      await supabaseApi
        .from('billeteras')
        .update({ saldo: nuevoSaldo, actualizado_en: new Date().toISOString() })
        .eq('id', usuarioId)
    }

    return res.status(200).json({ ok: true, acreditado: monto })
  } catch {
    // Error inesperado: 200 para que Culqi no reintente en bucle por un dato malo.
    return res.status(200).json({ ok: false })
  }
}
