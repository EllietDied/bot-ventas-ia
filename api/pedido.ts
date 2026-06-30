// api/pedido.ts — API REST de un pedido por id (?id=).
//   GET    /api/pedido?id=1   -> obtiene un pedido (con su detalle).
//   PUT    /api/pedido?id=1   -> actualiza el estado ('pendiente' | 'atendido').
//   DELETE /api/pedido?id=1   -> elimina un pedido (y su detalle, en cascada).
// Respuestas en JSON. Códigos: 200, 400, 404, 405, 500.
// Habla con Supabase por fetch (ver api/_supabase.ts), sin el SDK.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pedir, leerBody, leerId, supabaseConfigurado, RETORNAR } from './_supabase'

const ESTADOS = ['pendiente', 'atendido']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabaseConfigurado) {
    return res.status(500).json({ error: 'Supabase no está configurado en el servidor.' })
  }

  const id = leerId(req.query.id)
  if (id === null) {
    return res.status(400).json({ error: 'Falta el parámetro ?id= o no es válido.' })
  }

  try {
    // ----- GET: obtener por id -----
    if (req.method === 'GET') {
      const { ok, datos } = await pedir(`pedidos?id=eq.${id}&select=*,detalle_pedido(*)`)
      if (!ok) return res.status(500).json({ error: 'No se pudo leer el pedido.' })
      const pedido = Array.isArray(datos) ? datos[0] : null
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado.' })
      return res.status(200).json({ pedido })
    }

    // ----- PUT: actualizar estado -----
    if (req.method === 'PUT') {
      const b = leerBody(req.body)
      const estado = b.estado
      if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ error: `Estado inválido. Usa: ${ESTADOS.join(' o ')}.` })
      }
      const { ok, datos } = await pedir(`pedidos?id=eq.${id}`, {
        method: 'PATCH',
        headers: RETORNAR,
        body: JSON.stringify({ estado }),
      })
      if (!ok) return res.status(500).json({ error: 'No se pudo actualizar el pedido.' })
      const pedido = Array.isArray(datos) ? datos[0] : null
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado.' })
      return res.status(200).json({ pedido })
    }

    // ----- DELETE: eliminar -----
    if (req.method === 'DELETE') {
      const { ok, datos } = await pedir(`pedidos?id=eq.${id}`, {
        method: 'DELETE',
        headers: RETORNAR,
      })
      if (!ok) return res.status(500).json({ error: 'No se pudo eliminar el pedido.' })
      const eliminado = Array.isArray(datos) ? datos[0] : null
      if (!eliminado) return res.status(404).json({ error: 'Pedido no encontrado.' })
      return res.status(200).json({ ok: true, eliminado })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
