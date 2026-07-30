// api/pedidos.ts — API REST de pedidos (colección).
//   GET  /api/pedidos   -> lista TUS pedidos (requiere sesión; el RLS filtra lo tuyo).
//   POST /api/pedidos   -> registra un pedido a TU nombre (requiere sesión).
// Respuestas en JSON. Códigos: 200, 201, 400, 401, 405, 500.
//
// SEGURIDAD: clave ANÓNIMA + TOKEN del usuario => el RLS de la base decide qué pedidos
// ve/crea cada quien. Sin sesión, no se devuelve nada (datos personales).
import type { VercelRequest, VercelResponse } from './_types.js'

const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const SUPA_OK = !!(SUPA_URL && ANON)
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

      const itemsEntrada = Array.isArray(b.items) ? b.items : []
      if (itemsEntrada.length === 0 || itemsEntrada.length > 50) {
        return res.status(400).json({ error: 'El pedido debe incluir entre 1 y 50 productos.' })
      }

      const items = itemsEntrada.map((item: any) => ({
        producto_id: Number(item.producto_id ?? item.idProducto),
        cantidad: Number(item.cantidad),
      }))
      const itemsValidos = items.every(
        (item) =>
          Number.isSafeInteger(item.producto_id) &&
          item.producto_id > 0 &&
          Number.isSafeInteger(item.cantidad) &&
          item.cantidad > 0 &&
          item.cantidad <= 100,
      )
      if (!itemsValidos) {
        return res.status(400).json({ error: 'Los productos o cantidades no son válidos.' })
      }

      const metodo =
        typeof (b.metodoPago ?? b.metodo_pago) === 'string'
          ? String(b.metodoPago ?? b.metodo_pago).slice(0, 30)
          : 'tarjeta'
      const banco = typeof b.banco === 'string' ? b.banco.slice(0, 60) : null

      // La RPC toma el usuario del token y calcula precios, descuento y total
      // exclusivamente con datos actuales del catálogo.
      const { ok, datos } = await pedir(
        'rpc/crear_pedido',
        {
          method: 'POST',
          body: JSON.stringify({ items, metodo, banco }),
        },
        token,
      )
      if (!ok || !datos?.ok || !Number.isSafeInteger(Number(datos?.pedido_id))) {
        const mensaje =
          typeof datos?.error === 'string' ? datos.error : 'No se pudo registrar el pedido.'
        return res.status(ok ? 400 : 500).json({ error: mensaje })
      }

      const pedidoId = Number(datos.pedido_id)
      const lectura = await pedir(
        `pedidos?id=eq.${pedidoId}&select=*,detalle_pedido(*)`,
        {},
        token,
      )
      const pedido = Array.isArray(lectura.datos) ? lectura.datos[0] : null
      return res.status(201).json({ pedido: pedido ?? { id: pedidoId, ...datos } })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
