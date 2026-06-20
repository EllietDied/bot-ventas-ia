import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { PilaConsultas, Consulta } from '../core/estructuras/PilaConsultas'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { usarSupabase } from '../core/datos/supabase'
import {
  listarConsultasSupabase,
  insertarConsultaSupabase,
  limpiarConsultasSupabase,
} from '../core/servicios/ConsultasService'
import { useSesion } from './SesionContext'

interface ConsultasContextType {
  consultasRecientes: Consulta[] // en orden LIFO (más reciente primero)
  categoriasConsultadas: string[] // para las recomendaciones
  registrarConsulta: (termino: string, categoria: string) => void
  limpiarConsultas: () => void
}

const ConsultasContext = createContext<ConsultasContextType | undefined>(undefined)

export function ConsultasProvider({ children }: { children: ReactNode }) {
  const { usuarioActual } = useSesion()

  // Guardamos las consultas como arreglo (en orden cronológico).
  const [consultas, setConsultas] = useState<Consulta[]>(() =>
    usarSupabase() ? [] : cargar<Consulta[]>('consultas', []),
  )

  // Guardamos en localStorage SOLO en el modo local.
  useEffect(() => {
    if (!usarSupabase()) guardar('consultas', consultas)
  }, [consultas])

  // Con Supabase: cargamos las consultas del usuario (cambian al iniciar/cerrar sesión).
  useEffect(() => {
    if (!usarSupabase()) return
    const id = usuarioActual?.idUsuario
    if (!id) {
      setConsultas([])
      return
    }
    let activo = true
    listarConsultasSupabase(id).then((lista) => {
      if (activo) setConsultas(lista)
    })
    return () => {
      activo = false
    }
  }, [usuarioActual?.idUsuario])

  // Reconstruimos la PILA a partir del arreglo para usar su lógica LIFO.
  const pila = new PilaConsultas()
  for (const c of consultas) pila.apilar(c)
  const consultasRecientes = pila.listar() // LIFO: la última consulta va primero

  const categoriasConsultadas = consultas.map((c) => c.categoria).filter((c) => c !== '')

  function registrarConsulta(termino: string, categoria: string) {
    const nueva: Consulta = {
      termino,
      categoria,
      fechaHora: new Date().toLocaleString(),
    }
    // Con Supabase, persistimos en segundo plano (la UI se actualiza al instante).
    if (usarSupabase() && usuarioActual) {
      insertarConsultaSupabase(usuarioActual.idUsuario, termino, categoria)
    }
    setConsultas((prev) => [...prev, nueva])
  }

  function limpiarConsultas() {
    if (usarSupabase() && usuarioActual) limpiarConsultasSupabase(usuarioActual.idUsuario)
    setConsultas([])
  }

  return (
    <ConsultasContext.Provider
      value={{ consultasRecientes, categoriasConsultadas, registrarConsulta, limpiarConsultas }}
    >
      {children}
    </ConsultasContext.Provider>
  )
}

export function useConsultas() {
  const ctx = useContext(ConsultasContext)
  if (!ctx) throw new Error('useConsultas debe usarse dentro de ConsultasProvider')
  return ctx
}
