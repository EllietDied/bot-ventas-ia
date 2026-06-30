// api/pedidos.ts — API REST de pedidos (colección).
//   GET  /api/pedidos   -> lista TUS pedidos (requiere sesión; el RLS filtra lo tuyo).
//   POST /api/pedidos   -> registra un pedido a TU nombre (requiere sesión).
// Respuestas en JSON. Códigos: 200, 201, 400, 401, 405, 500.
//
// SEGURIDAD: clave ANÓNIMA + TOKEN del usuario => el RLS de la base decide qué pedidos
// ve/crea cada quien. Sin sesión, no se devuelve nada (datos personales).
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

  try {
    // Tanto GET como POST requieren sesión (los pedidos son datos personales).
    const token = tokenDe(req)
    const uid = await uidDe(token)
    if (!uid) return res.status(401).json({ error: 'Necesitas iniciar sesión.' })

    // ----- GET: listar (el RLS devuelve solo los pedidos del usuario) -----
    if (req.method === 'GET') {
      const { ok, datos } = await pedir(
        'pedidos?select=*,detalle_pedido(*)&order=creado_en.desc',
        {},
        token,
      )
      if (!ok) return res.status(500).json({ error: 'No se pudieron leer los pedidos.' })
      return res.status(200).json({ pedidos: datos ?? [] })
    }

    // ----- POST: registrar (a nombre del usuario autenticado) -----
    if (req.method === 'POST') {
      const b = leerBody(req.body)

      const items = Array.isArray(b.items) ? b.items : []
      if (items.length === 0) {
        return res.status(400).json({ error: 'El pedido debe incluir al menos un producto (items).' })
      }

      const subtotal = Number(
        b.subtotal ??
          items.reduce(
            (s: number, i: any) => s + Number(i.precio ?? 0) * Number(i.cantidad ?? 0),
            0,
          ),
      )
      const descuento = Number(b.descuento ?? 0)
      const total = Number(b.total ?? subtotal - descuento)

      // id_comprador = el usuario autenticado (NO del cuerpo). El RLS exige que coincida.
      const { ok, datos } = await pedir(
        'pedidos',
        {
          method: 'POST',
          headers: RETORNAR,
          body: JSON.stringify({
            id_comprador: uid,
            correo_comprador: b.correoComprador ?? b.correo_comprador ?? '',
            subtotal,
            descuento,
            total,
            metodo_pago: b.metodoPago ?? b.metodo_pago ?? 'tarjeta',
            banco: b.banco ?? null,
            estado: 'pendiente',
            estado_pago: 'aprobado', // pago simulado
          }),
        },
        token,
      )
      const pedido = Array.isArray(datos) ? datos[0] : datos
      if (!ok || !pedido) {
        return res.status(500).json({ error: 'No se pudo registrar el pedido.' })
      }

      const detalle = items.map((i: any) => ({
        pedido_id: pedido.id,
        producto_id: i.idProducto ?? i.producto_id ?? null,
        nombre: i.nombre ?? '',
        cantidad: Number(i.cantidad ?? 1),
        precio: Number(i.precio ?? 0),
      }))
      await pedir('detalle_pedido', { method: 'POST', body: JSON.stringify(detalle) }, token)

      return res.status(201).json({ pedido: { ...pedido, detalle_pedido: detalle } })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
