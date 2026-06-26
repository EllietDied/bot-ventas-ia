import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSesion } from '../contexto/SesionContext'
import { Rol } from '../core/modelos/Usuario'

// Protege una ruta: si no hay sesión, redirige a la Intro pública (/).
// Si se indica un rol y el usuario no lo tiene, redirige al inicio.
export function RutaProtegida({ children, rol }: { children: ReactNode; rol?: Rol }) {
  const { usuarioActual, cargandoSesion } = useSesion()

  // Mientras se restaura la sesión (modo Supabase) no redirigimos: así no
  // sacamos al usuario de una ruta protegida al recargar la página.
  if (cargandoSesion) {
    return (
      <div className="texto-tenue" style={{ padding: '3rem', textAlign: 'center' }}>
        Cargando…
      </div>
    )
  }
  if (!usuarioActual) return <Navigate to="/" replace />
  if (rol && usuarioActual.rol !== rol) return <Navigate to="/" replace />

  return <>{children}</>
}
