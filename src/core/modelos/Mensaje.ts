// Mensaje entre usuarios (comprador ↔ vendedor) — requisito RF10.
// Las conversaciones se guardan en una lista Mensaje[].
export interface Mensaje {
  idMensaje: string
  remitente: string // id de quien envía (idUsuario)
  destinatario: string // id de quien recibe (idUsuario)
  remitenteNombre?: string // nombre de quien envía (para mostrar)
  destinatarioNombre?: string // nombre de quien recibe (para mostrar)
  idProducto: number // producto relacionado
  nombreProducto: string
  contenido: string
  fechaHora: string
  leido: boolean
  // 'consulta' = comprador → vendedor; 'respuesta' = vendedor → comprador
  tipoMensaje: 'consulta' | 'respuesta'
}
