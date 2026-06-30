// api/pedido.ts — API REST de un pedido por id (?id=).
//   GET    /api/pedido?id=1   -> obtiene TU pedido (requiere sesión).
//   PUT    /api/pedido?id=1   -> cambia el estado ('pendiente'|'atendido'); solo el vendedor.
//   DELETE /api/pedido?id=1   -> elimina (restringido por el RLS).
// Respuestas en JSON. Códigos: 200, 400, 401, 404, 405, 500.
//
// SEGURIDAD: clave ANÓNIMA + TOKEN del usuario => el RLS de la base autoriza. Cada
// quien solo accede a los pedidos que le corresponden.
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const SUPA_OK = !!(SUPA_URL && ANON)
const RETORNAR = { Prefer: 'return=representation' }
const ESTADOS = ['pendiente', 'atendido']

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

function tokenDe(req: VercelRequest): string {
  const a = typeof req.headers.authorization === 'string' ? req.headers.authorization : ''
  return a.startsWith('Bearer ') ? a.slice(7).trim() : ''
}

async function uidDe(token: string): Promise<string> {
  if (!token) return ''
  const u = await fetch(SUPA_URL + '/auth/v1/user', {
    headers: { apikey: ANON, Authorization: 'Bearer ' + token },
  })
  if (!u.ok) return ''
  const ud = await u.json().catch(() => null)
  return ud && typeof ud.id === 'string' ? ud.id : ''
}

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

  const id = leerId(req.query.id)
  if (id === null) {
    return res.status(400).json({ error: 'Falta el parámetro ?id= o no es válido.' })
  }

  // Todas las operaciones de un pedido requieren sesión.
  const token = tokenDe(req)
  const uid = await uidDe(token)
  if (!uid) return res.status(401).json({ error: 'Necesitas iniciar sesión.' })

  try {
    // ----- GET: obtener por id (el RLS comprueba que sea tuyo) -----
    if (req.method === 'GET') {
      const { ok, datos } = await pedir(
        `pedidos?id=eq.${id}&select=*,detalle_pedido(*)`,
        {},
        token,
      )
      if (!ok) return res.status(500).json({ error: 'No se pudo leer el pedido.' })
      const pedido = Array.isArray(datos) ? datos[0] : null
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado o sin acceso.' })
      return res.status(200).json({ pedido })
    }

    // ----- PUT: actualizar estado (el RLS solo deja al vendedor de los productos) -----
    if (req.method === 'PUT') {
      const b = leerBody(req.body)
      const estado = b.estado
      if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ error: `Estado inválido. Usa: ${ESTADOS.join(' o ')}.` })
      }
      const { ok, datos } = await pedir(
        `pedidos?id=eq.${id}`,
        { method: 'PATCH', headers: RETORNAR, body: JSON.stringify({ estado }) },
        token,
      )
      if (!ok) return res.status(500).json({ error: 'No se pudo actualizar el pedido.' })
      const pedido = Array.isArray(datos) ? datos[0] : null
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado o sin permiso.' })
      return res.status(200).json({ pedido })
    }

    // ----- DELETE: eliminar (restringido por el RLS; puede devolver 404 si no procede) -----
    if (req.method === 'DELETE') {
      const { ok, datos } = await pedir(
        `pedidos?id=eq.${id}`,
        { method: 'DELETE', headers: RETORNAR },
        token,
      )
      if (!ok) return res.status(500).json({ error: 'No se pudo eliminar el pedido.' })
      const eliminado = Array.isArray(datos) ? datos[0] : null
      if (!eliminado) return res.status(404).json({ error: 'Pedido no encontrado o sin permiso.' })
      return res.status(200).json({ ok: true, eliminado })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
