// api/vision.ts
// Búsqueda por foto con VISIÓN en la nube: usa Gemma (multimodal) vía NVIDIA NIM para
// "ver" la imagen que sube el cliente, identificar el producto y elegir del catálogo.
// El resultado (descripción + ids) luego lo usa DeepSeek para conversar/recomendar.
//
// La clave vive SOLO en el servidor (NVIDIA_API_KEY), nunca en el navegador. Si no hay
// clave, o Gemma falla / tarda (cold start), devolvemos "no configurado" y el frontend
// usa la visión del navegador (MobileNet) como respaldo.

import type { VercelRequest, VercelResponse } from '@vercel/node'

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
// Modelo multimodal de Gemma en NVIDIA (cambiable con NVIDIA_MODELO sin tocar código).
const MODELO = process.env.NVIDIA_MODELO || 'google/gemma-4-31b-it'
// Cortamos si Gemma tarda demasiado (la 1ª vez puede estar "frío"); así cae a MobileNet.
const TIMEOUT_MS = 50000

interface ProductoCtx {
  id: number | string
  nombre: string
  categoria: string
  marca?: string
}

// PUNTO DE INTEGRACIÓN con Gemma (NVIDIA). Recibe la imagen (base64) y el catálogo;
// devuelve el término detectado, una descripción y los ids recomendados (o null si falla).
async function identificarProducto(
  imagenBase64: string,
  catalogo: ProductoCtx[],
): Promise<{ termino: string; etiqueta: string; productosRecomendados: string[] } | null> {
  if (!process.env.NVIDIA_API_KEY) return null

  const prompt = `Eres un identificador visual de productos para una tienda de tecnología. Mira la IMAGEN y compárala con el CATÁLOGO.
Devuelve SOLO un objeto JSON válido, sin texto adicional, con esta forma exacta:
{"termino": "categoría corta del producto (mouse, teclado, laptop, monitor, audífonos, parlante, celular, impresora, cámara web, etc.)", "etiqueta": "descripción breve y natural de lo que ves (tipo, color, marca visible si la hay)", "productosRecomendados": ["ids del catálogo que más se parecen a lo de la foto, como texto"]}
Si en la foto no hay un producto tecnológico claro, usa "termino": "".
CATÁLOGO (cada uno con su id real): ${JSON.stringify(catalogo)}`

  const ctrl = new AbortController()
  const cortar = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.NVIDIA_API_KEY,
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 400,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imagenBase64}` } },
            ],
          },
        ],
      }),
      signal: ctrl.signal,
    })
    if (!r.ok) return null

    const d = await r.json()
    const texto: string = d?.choices?.[0]?.message?.content ?? ''
    const ini = texto.indexOf('{')
    const fin = texto.lastIndexOf('}')
    if (ini === -1 || fin <= ini) return null

    const obj = JSON.parse(texto.slice(ini, fin + 1))
    const termino = typeof obj.termino === 'string' ? obj.termino.trim() : ''
    if (!termino) return null
    const etiqueta = typeof obj.etiqueta === 'string' && obj.etiqueta.trim() ? obj.etiqueta.trim() : termino

    // Solo dejamos pasar ids que existan de verdad en el catálogo.
    const idsValidos = new Set(catalogo.map((p) => String(p.id)))
    const productosRecomendados = Array.isArray(obj.productosRecomendados)
      ? obj.productosRecomendados.map((x: unknown) => String(x)).filter((id: string) => idsValidos.has(id))
      : []

    return { termino, etiqueta, productosRecomendados }
  } catch {
    // timeout / red / JSON inválido -> el frontend usará MobileNet
    return null
  } finally {
    clearTimeout(cortar)
  }
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
      // Sin proveedor / Gemma falló: el frontend usará la visión del navegador.
      return res.status(200).json({ error: 'vision_no_configurado', termino: '' })
    }
    return res.status(200).json(resultado)
  } catch {
    return res.status(502).json({ error: 'No se pudo identificar la imagen.' })
  }
}
