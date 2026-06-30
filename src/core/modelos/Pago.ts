// Métodos de pago aceptados.
export type MetodoPago =
  | 'tarjeta'
  | 'yape'
  | 'plin'
  | 'transferencia'
  | 'pagoefectivo'
  | 'paypal'
  | 'mercadopago'
  | 'billetera'

// Nombre "bonito" de cada método (para mostrarlo en la UI).
export const NOMBRE_METODO: Record<MetodoPago, string> = {
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia',
  pagoefectivo: 'PagoEfectivo',
  paypal: 'PayPal',
  mercadopago: 'Mercado Pago',
  billetera: 'Mi billetera',
}

// Bancos disponibles para la transferencia.
export const BANCOS = ['Interbank', 'Scotiabank', 'BCP', 'BBVA'] as const

// Pago asociado a un pedido.
export interface Pago {
  idPago: string
  metodoPago: MetodoPago
  banco?: string // solo cuando el método es transferencia
  monto: number
  estadoPago: string
  fechaPago: string
}
