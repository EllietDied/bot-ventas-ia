// Métodos de pago aceptados (simulados en esta demo).
export type MetodoPago = 'tarjeta' | 'yape' | 'plin' | 'efectivo'

// Pago asociado a un pedido.
export interface Pago {
  idPago: string
  metodoPago: MetodoPago
  monto: number
  estadoPago: string // 'aprobado' (el pago es simulado)
  fechaPago: string
}
