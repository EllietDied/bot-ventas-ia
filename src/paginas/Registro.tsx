import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion, DatosRegistro } from '../contexto/SesionContext'
import { Rol } from '../core/modelos/Usuario'
import { LogoUSS } from '../componentes/LogoUSS'

// Estado inicial del formulario.
const FORM_INICIAL: DatosRegistro = {
  nombre: '',
  apellido: '',
  telefono: '',
  dni: '',
  correo: '',
  contrasena: '',
  confirmar: '',
  direccion: '',
  distrito: '',
  departamento: '',
  rol: 'comprador',
}

// Pantalla de registro de nuevos usuarios.
export function Registro() {
  const { registrar } = useSesion()
  const navegar = useNavigate()

  const [form, setForm] = useState<DatosRegistro>(FORM_INICIAL)
  const [error, setError] = useState('')

  // Actualiza un campo del formulario por su nombre.
  function cambiar(campo: keyof DatosRegistro, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const resultado = registrar(form)
    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }
    navegar('/') // cuenta creada: vamos al catálogo
  }

  return (
    <div className="auth-contenedor">
      <div className="auth-tarjeta ancha">
        <div className="auth-logo">
          <LogoUSS size="medium" />
        </div>
        <h1 className="auth-titulo">Crear cuenta</h1>
        <p className="auth-subtitulo">Regístrate como comprador o vendedor</p>

        <form onSubmit={enviar} className="formulario">
          <div className="form-grid">
            <label className="campo">
              <span>Nombre *</span>
              <input value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
            </label>
            <label className="campo">
              <span>Apellido *</span>
              <input value={form.apellido} onChange={(e) => cambiar('apellido', e.target.value)} />
            </label>
            <label className="campo">
              <span>Teléfono</span>
              <input value={form.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />
            </label>
            <label className="campo">
              <span>DNI</span>
              <input value={form.dni} onChange={(e) => cambiar('dni', e.target.value)} />
            </label>
            <label className="campo">
              <span>Correo *</span>
              <input value={form.correo} onChange={(e) => cambiar('correo', e.target.value)} />
            </label>
            <label className="campo">
              <span>Rol *</span>
              <select value={form.rol} onChange={(e) => cambiar('rol', e.target.value as Rol)}>
                <option value="comprador">Comprador</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </label>
            <label className="campo">
              <span>Contraseña *</span>
              <input
                type="password"
                value={form.contrasena}
                onChange={(e) => cambiar('contrasena', e.target.value)}
              />
            </label>
            <label className="campo">
              <span>Confirmar contraseña *</span>
              <input
                type="password"
                value={form.confirmar}
                onChange={(e) => cambiar('confirmar', e.target.value)}
              />
            </label>
            <label className="campo">
              <span>Dirección</span>
              <input value={form.direccion} onChange={(e) => cambiar('direccion', e.target.value)} />
            </label>
            <label className="campo">
              <span>Distrito</span>
              <input value={form.distrito} onChange={(e) => cambiar('distrito', e.target.value)} />
            </label>
            <label className="campo">
              <span>Departamento</span>
              <input
                value={form.departamento}
                onChange={(e) => cambiar('departamento', e.target.value)}
              />
            </label>
          </div>

          {error && <p className="mensaje-error">{error}</p>}

          <button type="submit" className="btn btn-primario btn-bloque">
            Registrarme
          </button>
        </form>

        <p className="auth-pie">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
