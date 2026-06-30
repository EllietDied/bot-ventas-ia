// api/productos.ts — API REST de productos (colección).
//   GET  /api/productos        -> lista todos los productos.
//   POST /api/productos        -> crea un producto (JSON en el cuerpo).
// Respuestas en JSON. Códigos: 200, 201, 400, 405, 500.
// Habla con Supabase por fetch (ver api/_supabase.ts), sin el SDK.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pedir, leerBody, supabaseConfigurado, RETORNAR } from './_supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!supabaseConfigurado) {
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
