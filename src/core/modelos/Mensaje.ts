// Mensaje entre usuarios (comprador ↔ vendedor) — requisito RF10.
// Las conversaciones se guardan en una lista Mensaje[].
export interface Mensaje {
  idMensaje: string
  remitente: string // correo de quien envía
  destinatario: string // correo de quien recibe
  idProducto: number // producto relacionado
  nombreProducto: string
  contenido: string
  fechaHora: string
  leido: boolean
  // 'consulta' = comprador → vendedor; 'respuesta' = vendedor → comprador
  tipoMensaje: 'consulta' | 'respuesta'
}
