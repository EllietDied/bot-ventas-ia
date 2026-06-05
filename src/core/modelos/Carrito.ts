import { Producto } from './Producto'

// Un item del carrito: un producto y la cantidad elegida.
export interface ItemCarrito {
  producto: Producto
  cantidad: number
}

// CLASE Carrito: encapsula la lógica del carrito de compras
// (agregar, quitar y calcular subtotal, descuento y total).
export class Carrito {
  private items: ItemCarrito[]

  constructor(items: ItemCarrito[] = []) {
    // Copiamos los items para no modificar el arreglo original.
    this.items = items.map((i) => ({ ...i }))
  }

  obtenerItems(): ItemCarrito[] {
    return this.items
  }

  // Agrega un producto; si ya existe, suma 1 (sin superar el stock).
  agregarProducto(producto: Producto): void {
    const existente = this.items.find((i) => i.producto.id === producto.id)
    if (existente) {
      // No permitimos pasar del stock disponible.
      if (existente.cantidad < producto.stock) existente.cantidad += 1
    } else if (producto.stock > 0) {
      this.items.push({ producto, cantidad: 1 })
    }
  }

  eliminarProducto(idProducto: number): void {
    this.items = this.items.filter((i) => i.producto.id !== idProducto)
  }

  cambiarCantidad(idProducto: number, cantidad: number): void {
    const item = this.items.find((i) => i.producto.id === idProducto)
    if (item) {
      // La cantidad no puede superar el stock ni ser negativa.
      item.cantidad = Math.min(cantidad, item.producto.stock)
      if (item.cantidad <= 0) this.eliminarProducto(idProducto)
    }
  }

  // Suma de (precio * cantidad) de todos los productos.
  calcularSubtotal(): number {
    return this.items.reduce((acc, i) => acc + i.producto.precio * i.cantidad, 0)
  }

  // Regla de descuento simple (fácil de explicar):
  // 10% si el subtotal supera S/ 3000, 5% si supera S/ 1000, 0% si es menor.
  calcularDescuento(): number {
    const subtotal = this.calcularSubtotal()
    if (subtotal >= 3000) return subtotal * 0.1
    if (subtotal >= 1000) return subtotal * 0.05
    return 0
  }

  // Total a pagar = subtotal - descuento.
  calcularTotal(): number {
    return this.calcularSubtotal() - this.calcularDescuento()
  }

  // Cantidad total de unidades en el carrito.
  cantidadTotal(): number {
    return this.items.reduce((acc, i) => acc + i.cantidad, 0)
  }

  vaciar(): void {
    this.items = []
  }
}
