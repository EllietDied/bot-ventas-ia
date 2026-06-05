import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Mensaje } from '../core/modelos/Mensaje'
import { cargar, guardar } from '../core/datos/almacenamiento'

// Datos necesarios para enviar un mensaje.
export interface DatosMensaje {
  remitente: string
  destinatario: string
  idProducto: number
  nombreProducto: string
  contenido: string
  tipoMensaje: 'consulta' | 'respuesta'
}

interface MensajeriaContextType {
  mensajes: Mensaje[]
  enviarMensaje: (datos: DatosMensaje) => void
  marcarLeido: (idMensaje: string) => void
  mensajesDe: (correo: string) => Mensaje[]
  noLeidosDe: (correo: string) => number
}

const MensajeriaContext = createContext<MensajeriaContextType | undefined>(undefined)

export function MensajeriaProvider({ children }: { children: ReactNode }) {
  // LISTA de mensajes (Mensaje[]) con todas las conversaciones.
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => cargar<Mensaje[]>('mensajeria', []))

  useEffect(() => guardar('mensajeria', mensajes), [mensajes])

  function enviarMensaje(datos: DatosMensaje) {
    // Validación: no se permiten mensajes vacíos.
    if (datos.contenido.trim() === '') return
    const nuevo: Mensaje = {
      idMensaje: 'MSG-' + Date.now(),
      remitente: datos.remitente,
      destinatario: datos.destinatario,
      idProducto: datos.idProducto,
      nombreProducto: datos.nombreProducto,
      contenido: datos.contenido.trim(),
      fechaHora: new Date().toLocaleString(),
      leido: false,
      tipoMensaje: datos.tipoMensaje,
    }
    setMensajes((prev) => [...prev, nuevo])
  }

  function marcarLeido(idMensaje: string) {
    setMensajes((prev) =>
      prev.map((m) => (m.idMensaje === idMensaje ? { ...m, leido: true } : m)),
    )
  }

  // Mensajes en los que participa el usuario (enviados o recibidos).
  function mensajesDe(correo: string): Mensaje[] {
    return mensajes.filter((m) => m.remitente === correo || m.destinatario === correo)
  }

  // Cantidad de mensajes recibidos sin leer (para el aviso de la barra).
  function noLeidosDe(correo: string): number {
    return mensajes.filter((m) => m.destinatario === correo && !m.leido).length
  }

  return (
    <MensajeriaContext.Provider
      value={{ mensajes, enviarMensaje, marcarLeido, mensajesDe, noLeidosDe }}
    >
      {children}
    </MensajeriaContext.Provider>
  )
}

export function useMensajeria() {
  const ctx = useContext(MensajeriaContext)
  if (!ctx) throw new Error('useMensajeria debe usarse dentro de MensajeriaProvider')
  return ctx
}
