import { useState } from 'react'
import { Link } from 'react-router-dom'
import { recuperarContrasena } from '../core/servicios/SupabaseAuthService'
import { usarSupabase } from '../core/datos/supabase'
import { InkaAnimatedBackground } from '../componentes/InkaAnimatedBackground'

// Pantalla "¿Olvidaste tu contraseña?": pide el correo y envía el enlace de
// recuperación (solo disponible en modo Supabase).
export function Recuperar() {
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMensaje('')
    if (!correo.trim()) {
      setError('Ingresa tu correo.')
      return
    }
    if (!usarSupabase()) {
      setError('La recuperación por correo solo está disponible con Supabase activo.')
      return
    }
    setEnviando(true)
    const r = await recuperarContrasena(correo)
    setEnviando(false)
    if (r.ok) setMensaje(r.mensaje)
    else setError(r.mensaje)
  }

  return (
    <div className="auth-contenedor inka-auth-bg">
      <InkaAnimatedBackground />
      <div className="auth-tarjeta">
        <h1 className="auth-titulo">Recuperar contraseña</h1>
        <p className="auth-subtitulo">Te enviaremos un enlace a tu correo para restablecerla.</p>

        <form onSubmit={enviar} className="formulario">
          <label className="campo">
            <span>Correo</span>
            <input
              type="email"
              value={correo}
              placeholder="tucorreo@ejemplo.com"
              onChange={(e) => setCorreo(e.target.value)}
            />
          </label>

          {error && <p className="mensaje-error">{error}</p>}
          {mensaje && <p style={{ color: 'var(--exito)', fontWeight: 600 }}>{mensaje}</p>}

          <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>

        <p className="auth-pie">
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
