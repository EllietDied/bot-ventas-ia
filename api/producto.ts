// api/producto.ts — API REST de un producto por id (?id=).
//   GET    /api/producto?id=1   -> obtiene un producto.
//   PUT    /api/producto?id=1   -> actualiza (solo los campos enviados).
//   DELETE /api/producto?id=1   -> elimina un producto.
// Respuestas en JSON. Códigos: 200, 400, 404, 405, 500.
//
// Ayudante de Supabase por fetch DENTRO del archivo (igual que api/pago-webhook.ts);
// sin SDK ni módulo compartido, que hacen fallar la función serverless en Vercel.
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const SUPA_OK = !!(SUPA_URL && SUPA_KEY)
const RETORNAR = { Prefer: 'return=representation' }

function leerBody(body: unknown): Record<string, any> {
  if (!body) return {}
  if (typeof body === 'string') {
    try { return JSON.parse(body) } catch { return {} }
  }
  return body as Record<string, any>
}

function leerId(valor: string | string[] | undefined): number | null {
  const crudo = Array.isArray(valor) ? valor[0] : valor
  const n = Number(crudo)
  return Number.isInteger(n) && n > 0 ? n : null
}

async function pedir(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPA_KEY,
      Authorization: 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  const txt = await r.text().catch(() => '')
  let datos: any = null
  if (txt) {
    try { datos = JSON.parse(txt) } catch { datos = null }
  }
  return { ok: r.ok, status: r.status, datos }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!SUPA_OK) {
    return res.status(500).json({ error: 'Supabase no está configurado en el servidor.' })
  }

  const id = leerId(req.query.id)
  if (id === null) {
    return res.status(400).json({ error: 'Falta el parámetro ?id= o no es válido.' })
  }

  try {
    // ----- GET: obtener por id -----
    if (req.method === 'GET') {
      const { ok, datos } = await pedir(`productos?id=eq.${id}&select=*`)
      if (!ok) return res.status(500).json({ error: 'No se pudo leer el producto.' })
      const producto = Array.isArray(datos) ? datos[0] : null
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' })
      return res.status(200).json({ producto })
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

      const { ok, datos } = await pedir(`productos?id=eq.${id}`, {
        method: 'PATCH',
        headers: RETORNAR,
        body: JSON.stringify(cambios),
      })
      if (!ok) return res.status(500).json({ error: 'No se pudo actualizar el producto.' })
      const producto = Array.isArray(datos) ? datos[0] : null
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' })
      return res.status(200).json({ producto })
    }

    // ----- DELETE: eliminar -----
    if (req.method === 'DELETE') {
      const { ok, datos } = await pedir(`productos?id=eq.${id}`, {
        method: 'DELETE',
        headers: RETORNAR,
      })
      if (!ok) return res.status(500).json({ error: 'No se pudo eliminar el producto.' })
      const eliminado = Array.isArray(datos) ? datos[0] : null
      if (!eliminado) return res.status(404).json({ error: 'Producto no encontrado.' })
      return res.status(200).json({ ok: true, eliminado })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
