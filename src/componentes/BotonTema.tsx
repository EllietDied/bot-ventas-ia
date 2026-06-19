import { useState } from 'react'
import { Icono } from './Icono'

// Lee el tema actual desde el atributo data-theme del <html>
// (lo deja preparado el script del index.html al cargar la app).
function temaActual(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

// Botón para cambiar entre modo claro y modo oscuro.
// Guarda la preferencia en localStorage (clave "theme").
export function BotonTema() {
  const [tema, setTema] = useState<'light' | 'dark'>(temaActual())

  function cambiar() {
    const nuevo = tema === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', nuevo)
    localStorage.setItem('theme', nuevo)
    setTema(nuevo)
  }

  return (
    <button
      className="btn-tema"
      onClick={cambiar}
      title={tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label="Cambiar tema"
    >
      <Icono nombre={tema === 'dark' ? 'sol' : 'luna'} size={18} />
    </button>
  )
}
