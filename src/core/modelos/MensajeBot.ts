// Mensaje del chat con el bot (IA simulada).
// Es distinto del Mensaje entre usuarios de RF10 (ver Mensaje.ts).
export interface MensajeBot {
  idMensaje: string
  emisor: 'usuario' | 'bot'
  contenido: string
  fechaHora: string
}
