import { Producto } from '../modelos/Producto'

// ALGORITMO ConsultarProducto:
// busca productos cuyo nombre o categoría contengan el término.
// Si el término está vacío, devuelve todos los productos.
export function buscarProductos(termino: string, productos: Producto[]): Producto[] {
  const t = termino.trim().toLowerCase()
  if (t === '') return productos
  return productos.filter(
    (p) => p.nombre.toLowerCase().includes(t) || p.categoria.toLowerCase().includes(t),
  )
}

// Devuelve la lista de categorías únicas (sin repetir).
export function obtenerCategorias(productos: Producto[]): string[] {
  return [...new Set(productos.map((p) => p.categoria))]
}
