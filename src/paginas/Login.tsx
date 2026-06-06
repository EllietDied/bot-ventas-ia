import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../contexto/SesionContext'
import { LogoUSS } from '../componentes/LogoUSS'

// Pantalla de inicio de sesión.
export function Login() {
  const { login } = useSesion()
  const navegar = useNavigate()

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validación de campos vacíos.
    if (!correo.trim() || !contrasena.trim()) {
      setError('Completa todos los campos.')
      return
    }

    const resultado = login(correo, contrasena)
    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }
    navegar('/') // sesión iniciada: vamos al catálogo
  }

  return (
    <div className="auth-contenedor">
      <div className="auth-tarjeta">
        <div className="auth-logo">
          <LogoUSS size="medium" />
        </div>
        <h1 className="auth-titulo">🤖 Asistente IA de Ventas</h1>
        <p className="auth-subtitulo">Inicia sesión y habla con tu asistente de ventas</p>

        <form onSubmit={enviar} className="formulario">
          <label className="campo">
            <span>Correo</span>
            <input
              type="text"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label className="campo">
            <span>Contraseña</span>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••"
            />
          </label>

          {error && <p className="mensaje-error">{error}</p>}

          <button type="submit" className="btn btn-primario btn-bloque">
            Ingresar
          </button>
        </form>

        <p className="auth-pie">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>

        <div className="auth-demo">
          <strong>Cuentas de prueba:</strong>
          <br />
          comprador@demo.com / 123456
          <br />
          vendedor@demo.com / 123456
        </div>
      </div>
    </div>
  )
}
