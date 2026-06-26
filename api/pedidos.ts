// api/pedidos.ts — API REST de pedidos (colección).
//   GET  /api/pedidos   -> lista pedidos (con sus líneas de detalle).
//   POST /api/pedidos   -> registra un pedido (pago SIMULADO; no se cobra nada real).
// Respuestas en JSON. Códigos: 200, 201, 400, 405, 500.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseApi, leerBody } from './_supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabaseApi) {
    return res.status(500).json({ error: 'Supabase no está configurado en el servidor.' })
  }

  try {
    // ----- GET: listar (con detalle embebido) -----
    if (req.method === 'GET') {
      const { data, error } = await supabaseApi
        .from('pedidos')
        .select('*, detalle_pedido(*)')
        .order('creado_en', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ pedidos: data ?? [] })
    }

    // ----- POST: registrar -----
    if (req.method === 'POST') {
      const b = leerBody(req.body)

      const items = Array.isArray(b.items) ? b.items : []
      if (items.length === 0) {
        return res.status(400).json({ error: 'El pedido debe incluir al menos un producto (items).' })
      }
      const idComprador = b.idComprador ?? b.id_comprador
      if (!idComprador) {
        return res.status(400).json({ error: 'Falta "idComprador".' })
      }

      // Totales: usa los enviados o los calcula desde los items.
      const subtotal = Number(
        b.subtotal ??
          items.reduce(
            (s: number, i: any) => s + Number(i.precio ?? 0) * Number(i.cantidad ?? 0),
            0,
          ),
      )
      const descuento = Number(b.descuento ?? 0)
      const total = Number(b.total ?? subtotal - descuento)

      const { data: pedido, error } = await supabaseApi
        .from('pedidos')
        .insert({
          id_comprador: idComprador,
          correo_comprador: b.correoComprador ?? b.correo_comprador ?? '',
          subtotal,
          descuento,
          total,
          metodo_pago: b.metodoPago ?? b.metodo_pago ?? 'tarjeta',
          banco: b.banco ?? null,
          estado: 'pendiente',
          estado_pago: 'aprobado', // pago simulado
        })
        .select()
        .single()
      if (error || !pedido) {
        return res.status(500).json({ error: error?.message ?? 'No se pudo registrar el pedido.' })
      }

      const detalle = items.map((i: any) => ({
        pedido_id: pedido.id,
        producto_id: i.idProducto ?? i.producto_id ?? null,
        nombre: i.nombre ?? '',
        cantidad: Number(i.cantidad ?? 1),
        precio: Number(i.precio ?? 0),
      }))
      await supabaseApi.from('detalle_pedido').insert(detalle)

      return res.status(201).json({ pedido: { ...pedido, detalle_pedido: detalle } })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
