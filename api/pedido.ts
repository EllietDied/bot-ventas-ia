// api/pedido.ts — API REST de un pedido por id (?id=).
//   GET    /api/pedido?id=1   -> obtiene un pedido (con su detalle).
//   PUT    /api/pedido?id=1   -> actualiza el estado ('pendiente' | 'atendido').
//   DELETE /api/pedido?id=1   -> elimina un pedido (y su detalle, en cascada).
// Respuestas en JSON. Códigos: 200, 400, 404, 405, 500.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseApi, leerBody, leerId } from './_supabase'

const ESTADOS = ['pendiente', 'atendido']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabaseApi) {
    return res.status(500).json({ error: 'Supabase no está configurado en el servidor.' })
  }

  const id = leerId(req.query.id)
  if (id === null) {
    return res.status(400).json({ error: 'Falta el parámetro ?id= o no es válido.' })
  }

  try {
    // ----- GET: obtener por id -----
    if (req.method === 'GET') {
      const { data, error } = await supabaseApi
        .from('pedidos')
        .select('*, detalle_pedido(*)')
        .eq('id', id)
        .maybeSingle()
      if (error) return res.status(500).json({ error: error.message })
      if (!data) return res.status(404).json({ error: 'Pedido no encontrado.' })
      return res.status(200).json({ pedido: data })
    }

    // ----- PUT: actualizar estado -----
    if (req.method === 'PUT') {
      const b = leerBody(req.body)
      const estado = b.estado
      if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ error: `Estado inválido. Usa: ${ESTADOS.join(' o ')}.` })
      }
      const { data, error } = await supabaseApi
        .from('pedidos')
        .update({ estado })
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) return res.status(500).json({ error: error.message })
      if (!data) return res.status(404).json({ error: 'Pedido no encontrado.' })
      return res.status(200).json({ pedido: data })
    }

    // ----- DELETE: eliminar -----
    if (req.method === 'DELETE') {
      const { data, error } = await supabaseApi
        .from('pedidos')
        .delete()
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) return res.status(500).json({ error: error.message })
      if (!data) return res.status(404).json({ error: 'Pedido no encontrado.' })
      return res.status(200).json({ ok: true, eliminado: data })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
