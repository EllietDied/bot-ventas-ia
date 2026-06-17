// Producto del catálogo (artículos tecnológicos).
export interface Producto {
  id: number
  nombre: string
  marca?: string // marca del producto (ej. Logitech). Opcional.
  descripcion: string
  categoria: string
  precio: number
  stock: number
  estado: string // 'disponible' | 'agotado'
  imagen: string // emoji representativo del producto
  idVendedor?: string // qué vendedor lo publicó (opcional)
}
