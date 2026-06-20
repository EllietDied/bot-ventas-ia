// api/vision.ts
// Función serverless para la BÚSQUEDA POR FOTO con un proveedor de visión en la
// nube. Es AGNÓSTICA al proveedor: cuando elijas uno (que soporte imágenes),
// solo implementas la función identificarProducto() de abajo.
//
// Mientras no haya proveedor configurado, devuelve "no configurado" y el frontend
// usa la visión del navegador (MobileNet). La clave vive solo en el servidor.

import type { VercelRequest, VercelResponse } from '@vercel/node'

// Catálogo mínimo que recibe la función (sin datos privados).
interface ProductoCtx {
  id: number | string
  nombre: string
  categoria: string
  marca?: string
}

// PUNTO ÚNICO DE INTEGRACIÓN con el proveedor de visión.
// Recibe la imagen (base64) y el catálogo; debe devolver el término detectado
// (mouse, teclado, laptop...) y, opcionalmente, los ids recomendados.
// Devuelve null cuando aún no hay proveedor configurado.
async function identificarProducto(
  _imagenBase64: string,
  _catalogo: ProductoCtx[],
): Promise<{ termino: string; etiqueta: string; productosRecomendados: string[] } | null> {
  if (!process.env.IA_API_KEY) return null
  // Aquí se conecta el proveedor de visión elegido (lee process.env.IA_API_KEY /
  // process.env.IA_PROVIDER). Debe analizar la imagen y devolver el término.
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' })
  }
  try {
    const cuerpo = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}

    const imagen = typeof cuerpo.imagen === 'string' ? cuerpo.imagen : ''
    if (!imagen) return res.status(400).json({ error: 'Falta la imagen.' })

    const productos: ProductoCtx[] = Array.isArray(cuerpo.productos)
      ? cuerpo.productos.slice(0, 40)
      : []

    // Quitamos el prefijo "data:image/...;base64," si viene.
    const base64 = imagen.includes(',') ? imagen.split(',')[1] : imagen

    const resultado = await identificarProducto(base64, productos)
    if (!resultado) {
      // Sin proveedor: el frontend usará la visión del navegador.
      return res.status(200).json({ error: 'vision_no_configurado', termino: '' })
    }
    return res.status(200).json(resultado)
  } catch {
    return res.status(502).json({ error: 'No se pudo identificar la imagen.' })
  }
}
