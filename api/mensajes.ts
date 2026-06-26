// api/mensajes.ts — API REST de mensajes (comprador <-> vendedor).
//   GET  /api/mensajes   -> lista mensajes (ordenados por fecha).
//   POST /api/mensajes   -> envía un mensaje (JSON en el cuerpo).
// Respuestas en JSON. Códigos: 200, 201, 400, 405, 500.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseApi, leerBody } from './_supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabaseApi) {
    return res.status(500).json({ error: 'Supabase no está configurado en el servidor.' })
  }

  try {
    // ----- GET: listar -----
    if (req.method === 'GET') {
      const { data, error } = await supabaseApi
        .from('mensajes')
        .select('*')
        .order('creado_en', { ascending: true })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ mensajes: data ?? [] })
    }

    // ----- POST: enviar -----
    if (req.method === 'POST') {
      const b = leerBody(req.body)

      const texto = String(b.texto ?? b.contenido ?? '').trim()
      if (!texto) {
        return res.status(400).json({ error: 'El mensaje no puede estar vacío.' })
      }
      const deUsuario = b.de_usuario ?? b.remitente
      const paraUsuario = b.para_usuario ?? b.destinatario
      if (!deUsuario) return res.status(400).json({ error: 'Falta el remitente (de_usuario).' })
      if (!paraUsuario) return res.status(400).json({ error: 'Falta el destinatario (para_usuario).' })

      const tipo = b.tipo ?? b.tipoMensaje ?? 'consulta'

      const { data, error } = await supabaseApi
        .from('mensajes')
        .insert({
          producto_id: b.producto_id ?? b.idProducto ?? null,
          nombre_producto: b.nombre_producto ?? b.nombreProducto ?? '',
          de_usuario: deUsuario,
          para_usuario: paraUsuario,
          de_nombre: b.de_nombre ?? b.remitenteNombre ?? '',
          para_nombre: b.para_nombre ?? b.destinatarioNombre ?? '',
          tipo: tipo === 'respuesta' ? 'respuesta' : 'consulta',
          texto,
          leido: false,
        })
        .select()
        .single()
      if (error) return res.status(500).json({ error: error.message })
      return res.status(201).json({ mensaje: data })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
