import { DetallePedido } from './DetallePedido'
import { Pago } from './Pago'

// Estados por los que pasa un pedido.
export type EstadoPedido = 'pendiente' | 'atendido'

// Pedido realizado por un comprador.
export interface Pedido {
  idPedido: string
  correoComprador: string
  fecha: string
  detalles: DetallePedido[]
  subtotal: number
  descuento: number
  total: number
  estado: EstadoPedido
  pago?: Pago
}
