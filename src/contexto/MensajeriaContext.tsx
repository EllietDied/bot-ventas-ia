import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Mensaje } from '../core/modelos/Mensaje'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { usarSupabase } from '../core/datos/supabase'
import {
  listarMensajesSupabase,
  enviarMensajeSupabase,
  marcarLeidoSupabase,
} from '../core/servicios/MensajeriaService'
import { useSesion } from './SesionContext'

// Datos necesarios para enviar un mensaje (los usuarios se identifican por idUsuario).
export interface DatosMensaje {
  remitente: string // idUsuario de quien envía
  destinatario: string // idUsuario de quien recibe
  remitenteNombre: string
  destinatarioNombre: string
  idProducto: number
  nombreProducto: string
  contenido: string
  tipoMensaje: 'consulta' | 'respuesta'
}

interface MensajeriaContextType {
  mensajes: Mensaje[]
  enviarMensaje: (datos: DatosMensaje) => void
  marcarLeido: (idMensaje: string) => void
  mensajesDe: (idUsuario: string) => Mensaje[]
  noLeidosDe: (idUsuario: string) => number
}

const MensajeriaContext = createContext<MensajeriaContextType | undefined>(undefined)

export function MensajeriaProvider({ children }: { children: ReactNode }) {
  const { usuarioActual } = useSesion()

  // LISTA de mensajes con las conversaciones.
  const [mensajes, setMensajes] = useState<Mensaje[]>(() =>
    usarSupabase() ? [] : cargar<Mensaje[]>('mensajeria', []),
  )

  // Guardamos en localStorage SOLO en el modo local.
  useEffect(() => {
    if (!usarSupabase()) guardar('mensajeria', mensajes)
  }, [mensajes])

  // Con Supabase: cargamos los mensajes del usuario (el RLS filtra los suyos).
  useEffect(() => {
    if (!usarSupabase()) return
    const id = usuarioActual?.idUsuario
    if (!id) {
      setMensajes([])
      return
    }
    let activo = true
    listarMensajesSupabase().then((lista) => {
      if (activo) setMensajes(lista)
    })
    return () => {
      activo = false
    }
  }, [usuarioActual?.idUsuario])

  async function enviarMensaje(datos: DatosMensaje) {
    // Validación: no se permiten mensajes vacíos.
    if (datos.contenido.trim() === '') return

    if (usarSupabase()) {
      const creado = await enviarMensajeSupabase({
        remitente: datos.remitente,
        destinatario: datos.destinatario,
        remitenteNombre: datos.remitenteNombre,
        destinatarioNombre: datos.destinatarioNombre,
        idProducto: datos.idProducto,
        nombreProducto: datos.nombreProducto,
        contenido: datos.contenido.trim(),
        tipoMensaje: datos.tipoMensaje,
      })
      if (creado) setMensajes((prev) => [...prev, creado])
      return
    }

    const nuevo: Mensaje = {
      idMensaje: 'MSG-' + Date.now(),
      remitente: datos.remitente,
      destinatario: datos.destinatario,
      remitenteNombre: datos.remitenteNombre,
      destinatarioNombre: datos.destinatarioNombre,
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
    if (usarSupabase()) marcarLeidoSupabase(idMensaje)
    setMensajes((prev) => prev.map((m) => (m.idMensaje === idMensaje ? { ...m, leido: true } : m)))
  }

  // Mensajes en los que participa el usuario (enviados o recibidos).
  function mensajesDe(idUsuario: string): Mensaje[] {
    return mensajes.filter((m) => m.remitente === idUsuario || m.destinatario === idUsuario)
  }

  // Cantidad de mensajes recibidos sin leer (para el aviso de la barra).
  function noLeidosDe(idUsuario: string): number {
    return mensajes.filter((m) => m.destinatario === idUsuario && !m.leido).length
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
