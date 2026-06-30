// api/productos.ts — API REST de productos (colección).
//   GET  /api/productos        -> lista todos los productos.
//   POST /api/productos        -> crea un producto (JSON en el cuerpo).
// Respuestas en JSON. Códigos: 200, 201, 400, 405, 500.
//
// Habla con Supabase por su API REST (PostgREST) vía fetch NATIVO, con el ayudante
// DENTRO del archivo (igual que api/pago-webhook.ts). No usamos el SDK ni un módulo
// compartido importado, porque eso hace fallar la función serverless en Vercel.
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

  try {
    // ----- GET: listar -----
    if (req.method === 'GET') {
      const { ok, datos } = await pedir('productos?select=*&order=id.asc')
      if (!ok) return res.status(500).json({ error: 'No se pudieron leer los productos.' })
      return res.status(200).json({ productos: datos ?? [] })
    }

    // ----- POST: crear -----
    if (req.method === 'POST') {
      const b = leerBody(req.body)

      // Validaciones (RA3): nombre, categoría, precio > 0, stock >= 0.
      if (!b.nombre || String(b.nombre).trim() === '') {
        return res.status(400).json({ error: 'El nombre del producto es obligatorio.' })
      }
      if (!b.categoria || String(b.categoria).trim() === '') {
        return res.status(400).json({ error: 'La categoría es obligatoria.' })
      }
      const precio = Number(b.precio)
      if (!Number.isFinite(precio) || precio <= 0) {
        return res.status(400).json({ error: 'El precio debe ser un número mayor a cero.' })
      }
      const stock = Number(b.stock ?? 0)
      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({ error: 'El stock debe ser un entero no negativo.' })
      }

      // Vendedor dueño: el indicado o, por defecto, el primer vendedor registrado.
      let idVendedor = b.idVendedor ?? b.id_vendedor
      let vendedorNombre = b.vendedorNombre ?? b.vendedor_nombre ?? ''
      if (!idVendedor) {
        const { datos: vs } = await pedir(
          'perfiles?select=id,nombre,apellido&rol=eq.vendedor&order=creado_en.asc&limit=1',
        )
        const v = Array.isArray(vs) ? vs[0] : null
        if (!v) {
          return res
            .status(400)
            .json({ error: 'No hay un vendedor registrado; envía "idVendedor" en el cuerpo.' })
        }
        idVendedor = v.id
        vendedorNombre = `${v.nombre ?? ''} ${v.apellido ?? ''}`.trim()
      }

      const { ok, datos } = await pedir('productos', {
        method: 'POST',
        headers: RETORNAR,
        body: JSON.stringify({
          nombre: String(b.nombre).trim(),
          marca: b.marca ? String(b.marca) : null,
          descripcion: b.descripcion ? String(b.descripcion) : '',
          categoria: String(b.categoria).trim(),
          precio,
          stock,
          estado: stock > 0 ? 'disponible' : 'agotado',
          imagen: b.imagen ? String(b.imagen) : '📦',
          id_vendedor: idVendedor,
          vendedor_nombre: vendedorNombre,
        }),
      })
      const producto = Array.isArray(datos) ? datos[0] : datos
      if (!ok || !producto) {
        return res.status(500).json({ error: 'No se pudo crear el producto.' })
      }
      return res.status(201).json({ producto })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
