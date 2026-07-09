// Producto del catálogo (artículos tecnológicos).
export interface Producto {
  id: number
  nombre: string
  marca?: string // marca del producto (ej. Logitech). Opcional.
  modelo?: string // modelo específico (ej. G502 HERO). Opcional.
  material?: string // material principal (ej. plástico ABS, aluminio). Opcional.
  descripcion: string
  caracteristicas?: string // ficha técnica / características (texto en varias líneas). Opcional.
  categoria: string
  precio: number
  stock: number
  estado: string // 'disponible' | 'agotado'
  imagen: string // imagen principal (miniatura): 1ª foto de la galería o un emoji
  imagenes?: string[] // galería: todas las fotos del producto (para el detalle)
  idVendedor?: string // qué vendedor lo publicó (opcional)
  vendedorNombre?: string // nombre del vendedor (lo usa la mensajería); presente con Supabase
}

// Código legible del producto para mostrarlo en la interfaz: prefijo de 3 letras
// de la categoría + el id (que es único). Ejemplos:
//   Mouse Gamer RGB (Periféricos, id 1)  -> "PER-001"
//   Laptop Gamer Lenovo (Laptops, id 14) -> "LAP-014"
export function codigoProducto(producto: Producto): string {
  const prefijo =
    producto.categoria
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '') // quita tildes: "Periféricos" -> "Perifericos"
      .replace(/[^a-zA-Z]/g, '') // deja solo letras
      .slice(0, 3)
      .toUpperCase() || 'GEN' // si la categoría no tiene letras, usa "GEN"
  return `${prefijo}-${String(producto.id).padStart(3, '0')}`
}
