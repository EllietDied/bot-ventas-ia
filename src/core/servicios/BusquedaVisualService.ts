// Orquestador de la BÚSQUEDA POR FOTO.
// Estrategia "las dos":
//   1) Si hay un proveedor de visión en la nube configurado, lo usa (/api/vision).
//   2) Si no, identifica en el navegador con MobileNet (funciona sin proveedor).
//   3) Si no logra identificar, el cliente elige la categoría a mano.
import { Producto } from '../modelos/Producto'
import { tokenSesionSupabase } from '../datos/supabase'
import { usarIAReal } from './AsistenteIAService'
import { identificarEnNavegador, filtrarPorTermino } from './VisionService'

export interface ResultadoBusquedaVisual {
  termino: string // 'mouse', 'teclado'... o '' si no es un producto tecnológico
  etiqueta: string // descripción amigable ('un mouse')
  descripcion?: string // lo que la IA "vio" en la foto (para que DeepSeek responda natural)
  productos: Producto[] // coincidencias del catálogo (distintas marcas/modelos)
  fuente: 'nube' | 'navegador' | 'manual'
  necesitaCategoria: boolean // true → el cliente debe elegir la categoría
}

// Consulta el proveedor de visión en la nube (cuando esté configurado).
// `pista` es una descripción opcional que escribe el cliente para acertar más.
async function consultarVisionNube(
  dataURL: string,
  productos: Producto[],
  pista = '',
): Promise<ResultadoBusquedaVisual | null> {
  // Cortamos la espera a los 55s (la función en Vercel dura máx. 60s): si la nube
  // no responde, abortamos y seguimos con la visión del navegador en vez de colgarnos.
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), 55000)
  let resp: Response
  try {
    const token = await tokenSesionSupabase()
    resp = await fetch('/api/vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controlador.signal,
      body: JSON.stringify({
        imagen: dataURL,
        pista,
        productos: productos
          .filter((p) => p.stock > 0)
          .slice(0, 30)
          .map((p) => ({ id: p.id, nombre: p.nombre, categoria: p.categoria, marca: p.marca })),
      }),
    })
  } finally {
    clearTimeout(temporizador)
  }
  if (!resp.ok) return null

  const datos = await resp.json()
  const termino = typeof datos?.termino === 'string' ? datos.termino : ''
  const descripcion = typeof datos?.descripcion === 'string' ? datos.descripcion : ''
  // Si Gemma no vio NADA (ni tipo ni descripción), caemos al respaldo del navegador.
  if (!datos || (!termino && !descripcion)) return null

  const ids = Array.isArray(datos.productosRecomendados)
    ? datos.productosRecomendados.map((x: unknown) => String(x))
    : []
  // Buscamos coincidencias por ids sugeridos o, si hay término, por el término.
  const encontrados = ids.length
    ? productos.filter((p) => ids.includes(String(p.id)))
    : termino
      ? filtrarPorTermino(termino, productos)
      : []

  return {
    termino,
    etiqueta: typeof datos.etiqueta === 'string' && datos.etiqueta ? datos.etiqueta : descripcion || termino,
    descripcion,
    productos: encontrados,
    fuente: 'nube',
    necesitaCategoria: encontrados.length === 0,
  }
}

// Identifica el producto de la foto y devuelve las opciones del catálogo.
export async function buscarPorFoto(
  dataURL: string,
  productos: Producto[],
  pista = '',
): Promise<ResultadoBusquedaVisual> {
  // 1) Nube (si hay proveedor de visión configurado). Reintentamos UNA vez: la
  //    primera llamada tras un rato suele fallar por "arranque en frío" del modelo
  //    (tarda en despertar); la segunda ya lo encuentra listo y responde.
  if (usarIAReal()) {
    for (let intento = 0; intento < 2; intento++) {
      try {
        const nube = await consultarVisionNube(dataURL, productos, pista)
        if (nube) return nube
      } catch {
        // si la nube falla, reintentamos o pasamos al respaldo del navegador
      }
    }
  }

  // 2) Navegador (MobileNet).
  try {
    const id = await identificarEnNavegador(dataURL)
    if (id.termino) {
      const encontrados = filtrarPorTermino(id.termino, productos)
      return {
        termino: id.termino,
        etiqueta: id.etiqueta,
        productos: encontrados,
        fuente: 'navegador',
        necesitaCategoria: encontrados.length === 0,
      }
    }
  } catch {
    // si la visión del navegador falla, pasamos al modo manual
  }

  // 3) Manual (el cliente elige la categoría).
  return { termino: '', etiqueta: '', productos: [], fuente: 'manual', necesitaCategoria: true }
}
