// Visión por computadora EN EL NAVEGADOR (sin servidor ni proveedor).
// Usa un modelo pre-entrenado (MobileNet, de TensorFlow.js) para identificar qué
// producto aparece en la foto. Las librerías se cargan de forma DIFERIDA (solo se
// descargan la primera vez que el usuario usa la cámara), para no inflar la app.
import { Producto } from '../modelos/Producto'

// El modelo devuelve etiquetas de ImageNet (en inglés). Las traducimos a términos
// del catálogo (en español) para poder filtrar los productos.
const MAPA_ETIQUETAS: { claves: string[]; termino: string; etiqueta: string }[] = [
  { claves: ['mouse'], termino: 'mouse', etiqueta: 'un mouse' },
  { claves: ['keyboard', 'space bar'], termino: 'teclado', etiqueta: 'un teclado' },
  { claves: ['laptop', 'notebook'], termino: 'laptop', etiqueta: 'una laptop' },
  { claves: ['monitor', 'screen', 'television'], termino: 'monitor', etiqueta: 'un monitor' },
  { claves: ['desktop computer'], termino: 'pc', etiqueta: 'una PC' },
  { claves: ['headphone', 'earphone', 'headset'], termino: 'audífonos', etiqueta: 'unos audífonos' },
  { claves: ['loudspeaker', 'speaker'], termino: 'parlante', etiqueta: 'un parlante' },
  { claves: ['joystick', 'gamepad', 'controller'], termino: 'gamer', etiqueta: 'un control gamer' },
  { claves: ['microphone', 'mike'], termino: 'micrófono', etiqueta: 'un micrófono' },
  { claves: ['hard disc', 'hard disk', 'hard drive'], termino: 'disco', etiqueta: 'almacenamiento' },
  { claves: ['printer'], termino: 'impresora', etiqueta: 'una impresora' },
  { claves: ['web cam', 'webcam'], termino: 'webcam', etiqueta: 'una webcam' },
  { claves: ['cellular', 'cell phone', 'smartphone', 'ipod'], termino: 'celular', etiqueta: 'un celular' },
]

// Tipo mínimo del modelo (evita depender de los tipos completos de la librería).
interface ModeloMobilenet {
  classify(img: HTMLImageElement, topk?: number): Promise<{ className: string; probability: number }[]>
}

let modeloPromesa: Promise<ModeloMobilenet> | null = null

// Carga MobileNet una sola vez (importa las librerías de forma diferida).
async function cargarModelo(): Promise<ModeloMobilenet> {
  if (!modeloPromesa) {
    modeloPromesa = (async () => {
      const tf = await import('@tensorflow/tfjs')
      await tf.ready()
      const mobilenet = await import('@tensorflow-models/mobilenet')
      return (await mobilenet.load()) as unknown as ModeloMobilenet
    })()
  }
  return modeloPromesa
}

export interface IdentificacionVisual {
  termino: string // término del catálogo (mouse, teclado...) o '' si no se reconoció
  etiqueta: string // descripción amigable ('un mouse')
  confianza: number
}

// Carga una imagen (dataURL) en un elemento <img>.
function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

// Identifica el producto de la foto con MobileNet, en el navegador.
export async function identificarEnNavegador(dataURL: string): Promise<IdentificacionVisual> {
  const modelo = await cargarModelo()
  const img = await cargarImagen(dataURL)
  const predicciones = await modelo.classify(img, 5)
  for (const p of predicciones) {
    const termino = terminoDeEtiqueta(p.className)
    if (termino) {
      const match = MAPA_ETIQUETAS.find((m) => m.termino === termino)!
      return { termino, etiqueta: match.etiqueta, confianza: p.probability }
    }
  }
  return { termino: '', etiqueta: predicciones[0]?.className ?? '', confianza: predicciones[0]?.probability ?? 0 }
}

// Filtra el catálogo por el término detectado (en nombre y categoría). Solo disponibles.
export function filtrarPorTermino(termino: string, productos: Producto[]): Producto[] {
  const t = termino.toLowerCase()
  if (!t) return []
  return productos.filter(
    (p) => p.stock > 0 && (p.nombre.toLowerCase().includes(t) || p.categoria.toLowerCase().includes(t)),
  )
}

// Dada una etiqueta cruda del modelo, devuelve el término del catálogo (o '').
export function terminoDeEtiqueta(etiqueta: string): string {
  const nombre = etiqueta.toLowerCase()
  return MAPA_ETIQUETAS.find((m) => m.claves.some((c) => nombre.includes(c)))?.termino ?? ''
}
