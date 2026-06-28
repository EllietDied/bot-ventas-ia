// api/pago-crear.ts
// Función serverless de Vercel: crea un pago en Culqi (la pasarela).
// La llave SECRETA de Culqi vive SOLO aquí (servidor), nunca llega al navegador.
//
//   - metodo 'pagoefectivo' -> crea una ORDEN (confirm:true) y devuelve el código CIP,
//     el QR y el link para pagar en efectivo. (El pago se confirma luego por webhook.)
//   - metodo 'tarjeta' | 'yape' -> con el token que tokenizó el frontend, crea un CARGO.
//
// IMPORTANTE: este endpoint NO toca la base de datos. El saldo de la billetera y el
// estado del pedido se actualizan en el WEBHOOK (otra fase), cuando Culqi confirma el
// pago de verdad. Aquí solo se "inicia" el cobro.

import type { VercelRequest, VercelResponse } from '@vercel/node'

const CULQI_API = 'https://api.culqi.com/v2'
const MIN_MONTO = 1 // S/ mínimo por operación
const MAX_MONTO = 5000 // S/ tope de seguridad por operación (sandbox)

// Datos del cliente que la orden de Culqi necesita (nada sensible).
interface ClienteCtx {
  nombre?: string
  apellido?: string
  email?: string
  telefono?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1) Solo POST.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' })
  }
  // 2) La llave secreta debe estar configurada en el servidor.
  if (!process.env.CULQI_SECRET_KEY) {
    return res.status(500).json({ error: 'La pasarela de pagos no está configurada.' })
  }

  try {
    const cuerpo = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}

    // 3) Validamos el monto (en soles) y lo pasamos a céntimos (lo que pide Culqi).
    const soles = Number(cuerpo.monto)
    if (!Number.isFinite(soles) || soles < MIN_MONTO || soles > MAX_MONTO) {
      return res
        .status(400)
        .json({ error: `El monto debe estar entre S/ ${MIN_MONTO} y S/ ${MAX_MONTO}.` })
    }
    const amount = Math.round(soles * 100)

    // 4) Concepto (recarga de billetera o compra) y a quién pertenece el pago.
    //    Esto viaja como "metadata" para que el WEBHOOK sepa qué hacer al confirmarse.
    //    (Seguridad: por ahora se confía en el usuarioId que envía el cliente; en la
    //     fase de seguridad se validará con el token de sesión de Supabase.)
    const concepto = cuerpo.concepto === 'compra' ? 'compra' : 'recarga'
    const usuarioId = typeof cuerpo.usuarioId === 'string' ? cuerpo.usuarioId.slice(0, 64) : ''
    const pedidoId = typeof cuerpo.pedidoId === 'string' ? cuerpo.pedidoId.slice(0, 64) : ''
    const cliente: ClienteCtx = cuerpo.cliente ?? {}
    const email = String(cliente.email || 'cliente@inkashop.com').slice(0, 100)
    const metadata = { usuario_id: usuarioId, concepto, pedido_id: pedidoId }
    const descripcion = concepto === 'recarga' ? 'Recarga de billetera InkaShop' : 'Compra en InkaShop'

    const metodo = cuerpo.metodo

    // 5a) PAGOEFECTIVO: creamos una ORDEN confirmada -> devuelve CIP + QR + link.
    if (metodo === 'pagoefectivo') {
      const respuesta = await fetch(CULQI_API + '/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.CULQI_SECRET_KEY,
        },
        body: JSON.stringify({
          amount,
          currency_code: 'PEN',
          description: descripcion,
          order_number: 'inka-' + Date.now(),
          client_details: {
            first_name: String(cliente.nombre || 'Cliente').slice(0, 50),
            last_name: String(cliente.apellido || 'InkaShop').slice(0, 50),
            email,
            phone_number: String(cliente.telefono || '999999999').slice(0, 20),
          },
          expiration_date: Math.floor(Date.now() / 1000) + 3 * 24 * 3600, // +3 días
          confirm: true, // genera el CIP de PagoEfectivo de inmediato
          metadata,
        }),
      })
      const d = await respuesta.json()
      if (!respuesta.ok || !d?.id) {
        return res
          .status(502)
          .json({ error: 'No se pudo generar el código de pago.', proveedorStatus: respuesta.status })
      }
      return res.status(200).json({
        tipo: 'pagoefectivo',
        orderId: d.id,
        cip: d.payment_code, // el código que paga el cliente
        qr: d.qr, // imagen QR
        url: d.url_pe, // link de PagoEfectivo
        monto: soles,
        expira: d.expiration_date,
      })
    }

    // 5b) TARJETA / YAPE: con el token del frontend, creamos un CARGO.
    if (metodo === 'tarjeta' || metodo === 'yape') {
      const token = typeof cuerpo.token === 'string' ? cuerpo.token : ''
      if (!token) {
        return res.status(400).json({ error: 'Falta el token de pago.' })
      }
      const respuesta = await fetch(CULQI_API + '/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.CULQI_SECRET_KEY,
        },
        body: JSON.stringify({
          amount,
          currency_code: 'PEN',
          email,
          source_id: token,
          description: descripcion,
          metadata,
        }),
      })
      const d = await respuesta.json()
      if (!respuesta.ok || !d?.id) {
        // Culqi devuelve un mensaje claro para el usuario cuando el cargo falla.
        const detalle =
          d?.user_message || d?.merchant_message || 'No se pudo procesar el pago con tarjeta.'
        return res.status(502).json({ error: detalle, proveedorStatus: respuesta.status })
      }
      return res.status(200).json({ tipo: 'cargo', chargeId: d.id, exitoso: true, monto: soles })
    }

    return res.status(400).json({ error: 'Método de pago no válido.' })
  } catch {
    // Nunca exponemos detalles internos ni la llave.
    return res.status(502).json({ error: 'No se pudo crear el pago.' })
  }
}
