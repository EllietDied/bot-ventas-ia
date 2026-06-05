import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Usuario, Rol } from '../core/modelos/Usuario'
import { iniciarSesion, validarRegistro, Resultado } from '../core/servicios/AuthService'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { USUARIOS_INICIALES } from '../core/datos/seed'

// Datos completos que llegan del formulario de registro.
export interface DatosRegistro {
  nombre: string
  apellido: string
  telefono: string
  dni: string
  correo: string
  contrasena: string
  confirmar: string
  direccion: string
  distrito: string
  departamento: string
  rol: Rol
}

// Qué expone el contexto de sesión.
interface SesionContextType {
  usuarioActual: Usuario | null
  usuarios: Usuario[]
  login: (correo: string, contrasena: string) => Resultado
  registrar: (datos: DatosRegistro) => Resultado
  logout: () => void
}

const SesionContext = createContext<SesionContextType | undefined>(undefined)

export function SesionProvider({ children }: { children: ReactNode }) {
  // Lista de usuarios registrados (se carga desde localStorage).
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => cargar('usuarios', USUARIOS_INICIALES))
  // Usuario que tiene la sesión iniciada.
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() =>
    cargar<Usuario | null>('sesion', null),
  )

  // Cada vez que cambian, los guardamos en localStorage.
  useEffect(() => guardar('usuarios', usuarios), [usuarios])
  useEffect(() => guardar('sesion', usuarioActual), [usuarioActual])

  function login(correo: string, contrasena: string): Resultado {
    const usuario = iniciarSesion(correo, contrasena, usuarios)
    if (!usuario) return { ok: false, mensaje: 'Correo o contraseña incorrectos.' }
    setUsuarioActual(usuario)
    return { ok: true, mensaje: `Bienvenido, ${usuario.nombre}.` }
  }

  function registrar(datos: DatosRegistro): Resultado {
    // Reutilizamos las validaciones del servicio.
    const validacion = validarRegistro(datos, usuarios)
    if (!validacion.ok) return validacion

    const nuevo: Usuario = {
      idPersona: 'P-' + Date.now(),
      idUsuario: 'U-' + Date.now(),
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
      dni: datos.dni,
      correo: datos.correo,
      contrasena: datos.contrasena,
      direccion: datos.direccion,
      distrito: datos.distrito,
      departamento: datos.departamento,
      rol: datos.rol,
      estado: 'activo',
    }
    setUsuarios((prev) => [...prev, nuevo])
    setUsuarioActual(nuevo)
    return { ok: true, mensaje: 'Cuenta creada correctamente.' }
  }

  function logout() {
    setUsuarioActual(null)
  }

  return (
    <SesionContext.Provider value={{ usuarioActual, usuarios, login, registrar, logout }}>
      {children}
    </SesionContext.Provider>
  )
}

// Hook para usar el contexto de sesión de forma cómoda.
export function useSesion() {
  const ctx = useContext(SesionContext)
  if (!ctx) throw new Error('useSesion debe usarse dentro de SesionProvider')
  return ctx
}
