// api/vision.ts
// Búsqueda por foto con VISIÓN en la nube: usa Gemma (multimodal) vía NVIDIA NIM para
// "ver" la imagen que sube el cliente, identificar el producto y elegir del catálogo.
// El resultado (descripción + ids) luego lo usa DeepSeek para conversar/recomendar.
//
// La clave vive SOLO en el servidor (NVIDIA_API_KEY), nunca en el navegador. Si no hay
// clave, o Gemma falla / tarda (cold start), devolvemos "no configurado" y el frontend
// usa la visión del navegador (MobileNet) como respaldo.

import type { VercelRequest, VercelResponse } from './_types.js'
import { autenticar } from './_auth.js'

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
  pista = '',
): Promise<{
  termino: string
  etiqueta: string
  descripcion: string
  productosRecomendados: string[]
} | null> {
  if (!process.env.NVIDIA_API_KEY) return null

  // Pista opcional del cliente (palabras clave) para afinar la identificación.
  const lineaPista = pista.trim()
    ? `\nEl cliente escribió esta PISTA sobre la foto: "${pista.trim().slice(0, 200)}". Úsala para afinar tu identificación (pero fíjate en lo que REALMENTE muestra la imagen).`
    : ''

  const prompt = `Eres el asistente visual de InkaShop, una tienda de tecnología. Observa la IMAGEN con MUCHA atención y RAZONA qué es lo que aparece antes de responder.${lineaPista}

Fíjate en: el tipo de objeto, su forma y color, la marca o el texto que se lea, y para qué sirve. Sé preciso: no adivines a lo loco, describe lo que REALMENTE ves.

Devuelve SOLO un objeto JSON válido, sin texto adicional, con esta forma exacta:
{"descripcion": "en español, 1 o 2 frases naturales y concretas describiendo lo que ves (objeto, color, marca o texto visible)", "termino": "si es un producto tecnológico que una tienda así podría vender, su categoría corta (mouse, teclado, laptop, monitor, audífonos, parlante, celular, impresora, cámara web, componente...); si NO es tecnológico, deja una cadena vacía \\"\\"", "productosRecomendados": ["ids del catálogo que de verdad se parezcan a lo de la foto, como texto; usa [] si ninguno encaja"]}

Importante: SIEMPRE rellena "descripcion", aunque el objeto no sea tecnológico (por ejemplo una botella, ropa o comida). "termino" solo se rellena si es algo de tecnología.
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
    const descripcion = typeof obj.descripcion === 'string' ? obj.descripcion.trim() : ''
    // Solo fallamos (y caemos a MobileNet) si Gemma no devolvió NADA útil.
    if (!termino && !descripcion) return null
    // La "etiqueta" corta la usamos como descripción amigable de respaldo.
    const etiqueta = descripcion || termino

    // Solo dejamos pasar ids que existan de verdad en el catálogo.
    const idsValidos = new Set(catalogo.map((p) => String(p.id)))
    const productosRecomendados = Array.isArray(obj.productosRecomendados)
      ? obj.productosRecomendados.map((x: unknown) => String(x)).filter((id: string) => idsValidos.has(id))
      : []

    return { termino, etiqueta, descripcion, productosRecomendados }
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
    if (!(await autenticar(req))) {
      return res.status(401).json({ error: 'Necesitas iniciar sesión para usar la visión en la nube.' })
    }

    const cuerpo = typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}

    const imagen = typeof cuerpo.imagen === 'string' ? cuerpo.imagen : ''
    if (!imagen) return res.status(400).json({ error: 'Falta la imagen.' })
    // El frontend ya comprime a ~768px; cortamos aqui cualquier imagen enorme
    // (abuso/coste). ~4M de base64 equivalen a ~3MB de imagen, mas que suficiente.
    if (imagen.length > 4_000_000) {
      return res.status(413).json({ error: 'La imagen es demasiado grande.', termino: '' })
    }

    const productos: ProductoCtx[] = Array.isArray(cuerpo.productos)
      ? cuerpo.productos.slice(0, 40)
      : []
    const pista = typeof cuerpo.pista === 'string' ? cuerpo.pista : ''

    // Quitamos el prefijo "data:image/...;base64," si viene.
    const base64 = imagen.includes(',') ? imagen.split(',')[1] : imagen

    const resultado = await identificarProducto(base64, productos, pista)
    if (!resultado) {
      // Sin proveedor / Gemma falló: el frontend usará la visión del navegador.
      return res.status(200).json({ error: 'vision_no_configurado', termino: '' })
    }
    return res.status(200).json(resultado)
  } catch {
    return res.status(502).json({ error: 'No se pudo identificar la imagen.' })
  }
}
