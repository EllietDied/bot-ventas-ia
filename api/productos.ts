// api/productos.ts — API REST de productos (colección).
//   GET  /api/productos   -> lista el catálogo (PÚBLICO).
//   POST /api/productos   -> crea un producto (requiere sesión; queda a nombre del vendedor).
// Respuestas en JSON. Códigos: 200, 201, 400, 401, 405, 500.
//
// SEGURIDAD: usamos la clave ANÓNIMA + el TOKEN del usuario que llama, así la base
// aplica su seguridad por filas (RLS) automáticamente (no usamos la service role,
// que se saltaría el RLS). Helper por fetch DENTRO del archivo (sin SDK, que crashea).
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const SUPA_OK = !!(SUPA_URL && ANON)
const RETORNAR = { Prefer: 'return=representation' }

function leerBody(body: unknown): Record<string, any> {
  if (!body) return {}
  if (typeof body === 'string') {
    try { return JSON.parse(body) } catch { return {} }
  }
  return body as Record<string, any>
}

// Token de sesión del header Authorization (Bearer ...).
function tokenDe(req: VercelRequest): string {
  const a = typeof req.headers.authorization === 'string' ? req.headers.authorization : ''
  return a.startsWith('Bearer ') ? a.slice(7).trim() : ''
}

// Verifica el token contra Supabase Auth y devuelve el id del usuario ('' si no vale).
async function uidDe(token: string): Promise<string> {
  if (!token) return ''
  const u = await fetch(SUPA_URL + '/auth/v1/user', {
    headers: { apikey: ANON, Authorization: 'Bearer ' + token },
  })
  if (!u.ok) return ''
  const ud = await u.json().catch(() => null)
  return ud && typeof ud.id === 'string' ? ud.id : ''
}

// Llama a PostgREST. Con token actúa como ese usuario (RLS); sin token, como anónimo.
async function pedir(path: string, init: RequestInit = {}, token = '') {
  const r = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON,
      Authorization: 'Bearer ' + (token || ANON),
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
    // ----- GET: listar (PÚBLICO, sin sesión) -----
    if (req.method === 'GET') {
      const { ok, datos } = await pedir('productos?select=*&order=id.asc')
      if (!ok) return res.status(500).json({ error: 'No se pudieron leer los productos.' })
      return res.status(200).json({ productos: datos ?? [] })
    }

    // ----- POST: crear (requiere sesión; el producto queda a nombre del vendedor) -----
    if (req.method === 'POST') {
      const token = tokenDe(req)
      const uid = await uidDe(token)
      if (!uid) return res.status(401).json({ error: 'Necesitas iniciar sesión.' })

      const b = leerBody(req.body)
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

      // Nombre del vendedor: lo leemos de SU propio perfil (con su token; el RLS lo permite).
      let vendedorNombre = ''
      const perfil = await pedir(`perfiles?id=eq.${uid}&select=nombre,apellido`, {}, token)
      const p = Array.isArray(perfil.datos) ? perfil.datos[0] : null
      if (p) vendedorNombre = `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim()

      // id_vendedor = el usuario autenticado (NO se acepta del cuerpo). El RLS exige
      // que auth.uid() = id_vendedor, así nadie crea productos a nombre de otro.
      const { ok, datos } = await pedir(
        'productos',
        {
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
            id_vendedor: uid,
            vendedor_nombre: vendedorNombre,
          }),
        },
        token,
      )
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
