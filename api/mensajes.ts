// api/mensajes.ts — API REST de mensajes (comprador <-> vendedor).
//   GET  /api/mensajes   -> lista TUS mensajes (requiere sesión; el RLS filtra los tuyos).
//   POST /api/mensajes   -> envía un mensaje DE TU PARTE (requiere sesión).
// Respuestas en JSON. Códigos: 200, 201, 400, 401, 405, 500.
//
// SEGURIDAD: clave ANÓNIMA + TOKEN del usuario => el RLS solo deja ver/enviar lo que
// te corresponde (eres emisor o receptor). Sin sesión no se devuelve nada (son privados).
import type { VercelRequest, VercelResponse } from './_types.js'

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
    // Tanto GET como POST requieren sesión (los mensajes son privados).
    const token = tokenDe(req)
    const uid = await uidDe(token)
    if (!uid) return res.status(401).json({ error: 'Necesitas iniciar sesión.' })

    // ----- GET: listar (el RLS devuelve solo donde eres emisor o receptor) -----
    if (req.method === 'GET') {
      const { ok, datos } = await pedir('mensajes?select=*&order=creado_en.asc', {}, token)
      if (!ok) return res.status(500).json({ error: 'No se pudieron leer los mensajes.' })
      return res.status(200).json({ mensajes: datos ?? [] })
    }

    // ----- POST: enviar (de_usuario = el usuario autenticado) -----
    if (req.method === 'POST') {
      const b = leerBody(req.body)

      const texto = String(b.texto ?? b.contenido ?? '').trim()
      if (!texto) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío.' })
      }
      const paraUsuario = b.para_usuario ?? b.destinatario
      if (!paraUsuario) return res.status(400).json({ error: 'Falta el destinatario (para_usuario).' })

      const tipo = b.tipo ?? b.tipoMensaje ?? 'consulta'

      // de_usuario = el usuario autenticado (NO del cuerpo); el RLS exige que coincida,
      // así nadie envía mensajes suplantando a otra persona.
      const { ok, datos } = await pedir(
        'mensajes',
        {
          method: 'POST',
          headers: RETORNAR,
          body: JSON.stringify({
            producto_id: b.producto_id ?? b.idProducto ?? null,
            nombre_producto: b.nombre_producto ?? b.nombreProducto ?? '',
            de_usuario: uid,
            para_usuario: paraUsuario,
            de_nombre: b.de_nombre ?? b.remitenteNombre ?? '',
            para_nombre: b.para_nombre ?? b.destinatarioNombre ?? '',
            tipo: tipo === 'respuesta' ? 'respuesta' : 'consulta',
            texto,
            leido: false,
          }),
        },
        token,
      )
      const mensaje = Array.isArray(datos) ? datos[0] : datos
      if (!ok || !mensaje) {
        return res.status(500).json({ error: 'No se pudo enviar el mensaje.' })
      }
      return res.status(201).json({ mensaje })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
