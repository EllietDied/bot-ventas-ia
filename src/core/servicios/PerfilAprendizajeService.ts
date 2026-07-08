// PerfilAprendizajeService
// Construye un "resumen" (perfil) de cada cliente y de cada vendedor a partir de
// datos que YA existen en la base (compras, búsquedas, productos). Ese resumen se
// le pasa a la IA como contexto para que responda de forma PERSONALIZADA.
//
// Importante: la IA no se "reentrena". Simplemente lee esta ficha antes de responder.
// El perfil vive siempre (sale de compras/búsquedas), aunque la charla del chat se borre.
import { Producto } from '../modelos/Producto'
import { Pedido } from '../modelos/Pedido'

// Cuenta cuántas veces aparece cada texto y los devuelve del más frecuente al menos.
function contarYordenar(items: string[]): { nombre: string; veces: number }[] {
  const cuenta = new Map<string, number>()
  for (const it of items) {
    if (!it) continue
    cuenta.set(it, (cuenta.get(it) ?? 0) + 1)
  }
  return [...cuenta.entries()]
    .map(([nombre, veces]) => ({ nombre, veces }))
    .sort((a, b) => b.veces - a.veces)
}

// Toma los primeros N nombres distintos de una lista (conserva el orden).
function primerosDistintos(nombres: string[], n: number): string[] {
  const vistos = new Set<string>()
  const salida: string[] = []
  for (const nombre of nombres) {
    if (nombre && !vistos.has(nombre)) {
      vistos.add(nombre)
      salida.push(nombre)
      if (salida.length >= n) break
    }
  }
  return salida
}

// PERFIL DEL COMPRADOR: resume sus compras anteriores y sus búsquedas.
// `pedidos` deben ser SOLO los del comprador. Devuelve '' si no hay nada que resumir.
export function perfilComprador(
  pedidos: Pedido[],
  productos: Producto[],
  categoriasConsultadas: string[],
): string {
  // Para saber la categoría de cada producto comprado, cruzamos por su id con el catálogo.
  const categoriaPorId = new Map(productos.map((p) => [Number(p.id), p.categoria]))

  const categoriasCompradas: string[] = []
  const nombresComprados: string[] = []
  for (const ped of pedidos) {
    for (const d of ped.detalles) {
      const cat = categoriaPorId.get(Number(d.idProducto))
      if (cat) categoriasCompradas.push(cat)
      nombresComprados.push(d.nombreProducto)
    }
  }

  const lineas: string[] = []

  if (pedidos.length > 0) {
    const topCategorias = contarYordenar(categoriasCompradas)
      .slice(0, 3)
      .map((c) => `${c.nombre} (${c.veces})`)
      .join(', ')
    lineas.push(
      `- Compras anteriores: ${pedidos.length} pedido(s).` +
        (topCategorias ? ` Suele comprar en: ${topCategorias}.` : ''),
    )
    const ultimos = primerosDistintos(nombresComprados, 4)
    if (ultimos.length) lineas.push(`- Productos que ya compró: ${ultimos.join(', ')}.`)
  }

  // Búsquedas/categorías de interés (las últimas, sin repetir).
  const intereses = primerosDistintos(categoriasConsultadas.slice().reverse(), 4)
  if (intereses.length) lineas.push(`- Le interesan / ha buscado: ${intereses.join(', ')}.`)

  if (lineas.length === 0) return '' // cliente nuevo, sin historial: no añadimos nada

  return ['PERFIL DEL CLIENTE (úsalo para personalizar; NO lo menciones textualmente):', ...lineas].join(
    '\n',
  )
}

// PERFIL DEL VENDEDOR: en qué se especializa (según sus productos) y qué vende más.
// `misProductos` = productos publicados por él; `ventas` = pedidos que le atañen.
export function perfilVendedor(misProductos: Producto[], ventas: Pedido[]): string {
  const lineas: string[] = []

  if (misProductos.length > 0) {
    const topPublicadas = contarYordenar(misProductos.map((p) => p.categoria))
    const especialidad = topPublicadas[0]
    lineas.push(
      `- Tiene ${misProductos.length} producto(s) publicado(s).` +
        (especialidad
          ? ` Se especializa en: ${especialidad.nombre} (${especialidad.veces} producto/s).`
          : ''),
    )
  }

  // Categorías que más VENDE: cruzamos los detalles vendidos con SUS productos.
  const idsMios = new Set(misProductos.map((p) => Number(p.id)))
  const categoriaPorId = new Map(misProductos.map((p) => [Number(p.id), p.categoria]))
  const categoriasVendidas: string[] = []
  for (const ped of ventas) {
    for (const d of ped.detalles) {
      if (!idsMios.has(Number(d.idProducto))) continue // solo lo que es suyo
      const cat = categoriaPorId.get(Number(d.idProducto))
      // Repetimos por cada unidad vendida, para que el "más vendido" pese por cantidad.
      for (let i = 0; i < Math.max(1, d.cantidad); i++) if (cat) categoriasVendidas.push(cat)
    }
  }
  const topVendidas = contarYordenar(categoriasVendidas)
    .slice(0, 3)
    .map((c) => `${c.nombre} (${c.veces} und.)`)
    .join(', ')
  if (topVendidas) lineas.push(`- Categorías que más vende: ${topVendidas}.`)

  if (lineas.length === 0) return ''

  return ['PERFIL DEL VENDEDOR (úsalo para orientarlo; NO lo menciones textualmente):', ...lineas].join(
    '\n',
  )
}
