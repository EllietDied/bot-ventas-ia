import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { PilaConsultas, Consulta } from '../core/estructuras/PilaConsultas'
import { cargar, guardar } from '../core/datos/almacenamiento'

interface ConsultasContextType {
  consultasRecientes: Consulta[] // en orden LIFO (más reciente primero)
  categoriasConsultadas: string[] // para las recomendaciones
  registrarConsulta: (termino: string, categoria: string) => void
  limpiarConsultas: () => void
}

const ConsultasContext = createContext<ConsultasContextType | undefined>(undefined)

export function ConsultasProvider({ children }: { children: ReactNode }) {
  // Guardamos las consultas como arreglo (se persiste en localStorage).
  const [consultas, setConsultas] = useState<Consulta[]>(() =>
    cargar<Consulta[]>('consultas', []),
  )

  useEffect(() => guardar('consultas', consultas), [consultas])

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
    setConsultas((prev) => [...prev, nueva])
  }

  function limpiarConsultas() {
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
