// Detalle de un pedido: una línea por producto comprado.
export interface DetallePedido {
  idProducto: number
  nombreProducto: string
  cantidad: number
  precioUnitario: number
  subtotal: number // precioUnitario * cantidad
}
