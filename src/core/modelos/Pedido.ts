import { DetallePedido } from './DetallePedido'
import { Pago } from './Pago'
import { Direccion } from './Direccion'

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
  envio?: Direccion // dirección de envío elegida tras el pago
  empresaEnvio?: string // empresa de courier elegida (Shalom / Olva)
}
