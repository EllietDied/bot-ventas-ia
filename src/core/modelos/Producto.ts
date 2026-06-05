// Producto del catálogo (artículos tecnológicos).
export interface Producto {
  id: number
  nombre: string
  descripcion: string
  categoria: string
  precio: number
  stock: number
  estado: string // 'disponible' | 'agotado'
  imagen: string // emoji representativo del producto
  idVendedor?: string // qué vendedor lo publicó (opcional)
}
