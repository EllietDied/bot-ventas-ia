// api/producto.ts — API REST de un producto por id (?id=).
//   GET    /api/producto?id=1   -> obtiene un producto.
//   PUT    /api/producto?id=1   -> actualiza (solo los campos enviados).
//   DELETE /api/producto?id=1   -> elimina un producto.
// Respuestas en JSON. Códigos: 200, 400, 404, 405, 500.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseApi, leerBody, leerId } from './_supabase'

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
        .from('productos')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) return res.status(500).json({ error: error.message })
      if (!data) return res.status(404).json({ error: 'Producto no encontrado.' })
      return res.status(200).json({ producto: data })
    }

    // ----- PUT: actualizar (solo los campos enviados) -----
    if (req.method === 'PUT') {
      const b = leerBody(req.body)
      const cambios: Record<string, any> = {}

      if (b.nombre !== undefined) {
        if (String(b.nombre).trim() === '')
          return res.status(400).json({ error: 'El nombre no puede estar vacío.' })
        cambios.nombre = String(b.nombre).trim()
      }
      if (b.marca !== undefined) cambios.marca = b.marca ? String(b.marca) : null
      if (b.descripcion !== undefined) cambios.descripcion = String(b.descripcion)
      if (b.categoria !== undefined) {
        if (String(b.categoria).trim() === '')
          return res.status(400).json({ error: 'La categoría no puede estar vacía.' })
        cambios.categoria = String(b.categoria).trim()
      }
      if (b.precio !== undefined) {
        const precio = Number(b.precio)
        if (!Number.isFinite(precio) || precio <= 0)
          return res.status(400).json({ error: 'El precio debe ser mayor a cero.' })
        cambios.precio = precio
      }
      if (b.stock !== undefined) {
        const stock = Number(b.stock)
        if (!Number.isInteger(stock) || stock < 0)
          return res.status(400).json({ error: 'El stock debe ser un entero no negativo.' })
        cambios.stock = stock
        cambios.estado = stock > 0 ? 'disponible' : 'agotado'
      }
      if (b.imagen !== undefined) cambios.imagen = String(b.imagen)

      if (Object.keys(cambios).length === 0) {
        return res.status(400).json({ error: 'No se enviaron campos para actualizar.' })
      }

      const { data, error } = await supabaseApi
        .from('productos')
        .update(cambios)
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) return res.status(500).json({ error: error.message })
      if (!data) return res.status(404).json({ error: 'Producto no encontrado.' })
      return res.status(200).json({ producto: data })
    }

    // ----- DELETE: eliminar -----
    if (req.method === 'DELETE') {
      const { data, error } = await supabaseApi
        .from('productos')
        .delete()
        .eq('id', id)
        .select()
        .maybeSingle()
      if (error) return res.status(500).json({ error: error.message })
      if (!data) return res.status(404).json({ error: 'Producto no encontrado.' })
      return res.status(200).json({ ok: true, eliminado: data })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
