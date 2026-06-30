// api/pedidos.ts — API REST de pedidos (colección).
//   GET  /api/pedidos   -> lista pedidos (con sus líneas de detalle).
//   POST /api/pedidos   -> registra un pedido (pago SIMULADO; no se cobra nada real).
// Respuestas en JSON. Códigos: 200, 201, 400, 405, 500.
// Habla con Supabase por fetch (ver api/_supabase.ts), sin el SDK.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pedir, leerBody, supabaseConfigurado, RETORNAR } from './_supabase'

// Esta función habla con la base por fetch (helper en _supabase.ts), nunca por el SDK.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabaseConfigurado) {
    return res.status(500).json({ error: 'Supabase no está configurado en el servidor.' })
  }

  try {
    // ----- GET: listar (con detalle embebido) -----
    if (req.method === 'GET') {
      const { ok, datos } = await pedir(
        'pedidos?select=*,detalle_pedido(*)&order=creado_en.desc',
      )
      if (!ok) return res.status(500).json({ error: 'No se pudieron leer los pedidos.' })
      return res.status(200).json({ pedidos: datos ?? [] })
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

      const { ok, datos } = await pedir('pedidos', {
        method: 'POST',
        headers: RETORNAR,
        body: JSON.stringify({
          id_comprador: idComprador,
          correo_comprador: b.correoComprador ?? b.correo_comprador ?? '',
          subtotal,
          descuento,
          total,
          metodo_pago: b.metodoPago ?? b.metodo_pago ?? 'tarjeta',
          banco: b.banco ?? null,
          estado: 'pendiente',
          estado_pago: 'aprobado', // pago simulado
        }),
      })
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
      await pedir('detalle_pedido', { method: 'POST', body: JSON.stringify(detalle) })

      return res.status(201).json({ pedido: { ...pedido, detalle_pedido: detalle } })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Método no permitido.' })
  } catch {
    return res.status(500).json({ error: 'Error interno del servidor.' })
  }
}
