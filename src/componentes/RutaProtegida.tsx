import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSesion } from '../contexto/SesionContext'
import { Rol } from '../core/modelos/Usuario'

// Protege una ruta: si no hay sesión, redirige a la Intro pública (/).
// Si se indica un rol y el usuario no lo tiene, redirige al inicio.
export function RutaProtegida({ children, rol }: { children: ReactNode; rol?: Rol }) {
  const { usuarioActual } = useSesion()

  if (!usuarioActual) return <Navigate to="/" replace />
  if (rol && usuarioActual.rol !== rol) return <Navigate to="/" replace />

  return <>{children}</>
}
