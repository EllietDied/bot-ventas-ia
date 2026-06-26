// Lógica PURA para registrar un pedido en modo local (sin React, sin Supabase).
// El pago es SIMULADO (no se cobra nada real). Se usa desde PedidosContext y es
// fácil de probar con Vitest.
import { Pedido } from '../modelos/Pedido'
import { Pago, MetodoPago } from '../modelos/Pago'
import { DetallePedido } from '../modelos/DetallePedido'
import { ItemCarrito } from '../modelos/Carrito'

export interface DatosPedidoLocal {
  correoComprador: string
  items: ItemCarrito[]
  subtotal: number
  descuento: number
  total: number
  metodoPago: MetodoPago
  banco?: string
}

// Construye un Pedido (modo local) a partir del carrito. "ahora" (timestamp) se
// pasa como parámetro para que el resultado sea determinista y testeable.
export function construirPedidoLocal(d: DatosPedidoLocal, ahora: number): Pedido {
  const detalles: DetallePedido[] = d.items.map((i) => ({
    idProducto: i.producto.id,
    nombreProducto: i.producto.nombre,
    cantidad: i.cantidad,
    precioUnitario: i.producto.precio,
    subtotal: i.producto.precio * i.cantidad,
  }))

  const pago: Pago = {
    idPago: 'PG-' + ahora,
    metodoPago: d.metodoPago,
    banco: d.banco,
    monto: d.total,
    estadoPago: 'aprobado', // el pago es simulado
    fechaPago: new Date(ahora).toLocaleString(),
  }

  return {
    idPedido: 'PED-' + ahora,
    correoComprador: d.correoComprador,
    fecha: new Date(ahora).toLocaleString(),
    detalles,
    subtotal: d.subtotal,
    descuento: d.descuento,
    total: d.total,
    estado: 'pendiente',
    pago,
  }
}
