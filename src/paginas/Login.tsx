import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../contexto/SesionContext'
import { InkaAnimatedBackground } from '../componentes/InkaAnimatedBackground'

// Pantalla de inicio de sesión (solo el formulario, sobre el fondo inka).
export function Login() {
  const { login } = useSesion()
  const navegar = useNavigate()

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!correo.trim() || !contrasena.trim()) {
      setError('Completa todos los campos.')
      return
    }

    const resultado = login(correo, contrasena)
    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }
    navegar('/') // sesión iniciada
  }

  // Acceso rápido para explorar con una cuenta de demostración.
  function entrarComo(correo: string) {
    const r = login(correo, '123456')
    if (r.ok) navegar('/')
  }

  return (
    <div className="auth-contenedor inka-auth-bg">
      <InkaAnimatedBackground />
      <div className="auth-tarjeta">
        <img
          src="/assistant-inkashop.svg"
          alt="Asistente IA de InkaShop"
          className="mascota-inkashop auth-mascota"
        />
        <h1 className="auth-titulo">IA InkaShop</h1>
        <p className="auth-subtitulo">Inicia sesión para comprar o gestionar tu tienda.</p>

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
          <span className="auth-demo-titulo">¿Solo quieres explorar?</span>
          <div className="auth-demo-botones">
            <button
              type="button"
              className="btn btn-secundario btn-pequeno"
              onClick={() => entrarComo('comprador@demo.com')}
            >
              Entrar como comprador
            </button>
            <button
              type="button"
              className="btn btn-secundario btn-pequeno"
              onClick={() => entrarComo('vendedor@demo.com')}
            >
              Entrar como vendedor
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
