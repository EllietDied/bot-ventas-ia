import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Al cambiar de ruta (pathname), sube el scroll al inicio de la página.
// Evita que al abrir otra pantalla (p. ej. el detalle de un producto) aparezca
// scrolleada abajo, conservando la posición de la pantalla anterior. No pinta nada.
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
