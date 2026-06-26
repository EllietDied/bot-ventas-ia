import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { actualizarContrasena } from '../core/servicios/SupabaseAuthService'
import { InkaAnimatedBackground } from '../componentes/InkaAnimatedBackground'

// Pantalla a la que llega el usuario desde el enlace del correo: define su nueva
// contraseña (Supabase ya dejó una sesión de recuperación activa al abrir el enlace).
export function Restablecer() {
  const navegar = useNavigate()
  const [pass, setPass] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setOk('')
    if (pass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (pass !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setGuardando(true)
    const r = await actualizarContrasena(pass)
    setGuardando(false)
    if (r.ok) {
      setOk(r.mensaje)
      setTimeout(() => navegar('/login'), 1600)
    } else {
      setError(r.mensaje)
    }
  }

  return (
    <div className="auth-contenedor inka-auth-bg">
      <InkaAnimatedBackground />
      <div className="auth-tarjeta">
        <h1 className="auth-titulo">Nueva contraseña</h1>
        <p className="auth-subtitulo">Escribe y confirma tu nueva contraseña.</p>

        <form onSubmit={enviar} className="formulario">
          <label className="campo">
            <span>Nueva contraseña</span>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </label>
          <label className="campo">
            <span>Confirmar contraseña</span>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </label>

          {error && <p className="mensaje-error">{error}</p>}
          {ok && <p style={{ color: 'var(--exito)', fontWeight: 600 }}>{ok}</p>}

          <button type="submit" className="btn btn-primario btn-bloque" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
