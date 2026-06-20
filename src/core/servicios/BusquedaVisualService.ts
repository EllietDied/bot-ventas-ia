// Orquestador de la BÚSQUEDA POR FOTO.
// Estrategia "las dos":
//   1) Si hay un proveedor de visión en la nube configurado, lo usa (/api/vision).
//   2) Si no, identifica en el navegador con MobileNet (funciona sin proveedor).
//   3) Si no logra identificar, el cliente elige la categoría a mano.
import { Producto } from '../modelos/Producto'
import { usarIAReal } from './AsistenteIAService'
import { identificarEnNavegador, filtrarPorTermino } from './VisionService'

export interface ResultadoBusquedaVisual {
  termino: string // 'mouse', 'teclado'... o '' si no se identificó
  etiqueta: string // descripción amigable ('un mouse')
  productos: Producto[] // coincidencias del catálogo (distintas marcas/modelos)
  fuente: 'nube' | 'navegador' | 'manual'
  necesitaCategoria: boolean // true → el cliente debe elegir la categoría
}

// Consulta el proveedor de visión en la nube (cuando esté configurado).
async function consultarVisionNube(
  dataURL: string,
  productos: Producto[],
): Promise<ResultadoBusquedaVisual | null> {
  const resp = await fetch('/api/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imagen: dataURL,
      productos: productos
        .filter((p) => p.stock > 0)
        .slice(0, 30)
        .map((p) => ({ id: p.id, nombre: p.nombre, categoria: p.categoria, marca: p.marca })),
    }),
  })
  if (!resp.ok) return null

  const datos = await resp.json()
  if (!datos || typeof datos.termino !== 'string' || datos.termino === '') return null

  const ids = Array.isArray(datos.productosRecomendados)
    ? datos.productosRecomendados.map((x: unknown) => String(x))
    : []
  const encontrados = ids.length
    ? productos.filter((p) => ids.includes(String(p.id)))
    : filtrarPorTermino(datos.termino, productos)

  return {
    termino: datos.termino,
    etiqueta: typeof datos.etiqueta === 'string' ? datos.etiqueta : datos.termino,
    productos: encontrados,
    fuente: 'nube',
    necesitaCategoria: encontrados.length === 0,
  }
}

// Identifica el producto de la foto y devuelve las opciones del catálogo.
export async function buscarPorFoto(
  dataURL: string,
  productos: Producto[],
): Promise<ResultadoBusquedaVisual> {
  // 1) Nube (si hay proveedor de visión configurado).
  if (usarIAReal()) {
    try {
      const nube = await consultarVisionNube(dataURL, productos)
      if (nube) return nube
    } catch {
      // si la nube falla, seguimos con el navegador
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
