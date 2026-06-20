import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Usuario, Rol } from '../core/modelos/Usuario'
import { iniciarSesion, Resultado } from '../core/servicios/AuthService'
import { validarRegistroCompleto } from '../utils/validacionesRegistro'
import { validateIdentityDocument } from '../utils/validateIdentityDocument'
import { formatIdentityDocument } from '../utils/formatIdentityDocument'
import { validarUbicacion } from '../utils/validarUbicacion'
import { Ubicacion } from '../config/addressCountryConfig'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { USUARIOS_INICIALES } from '../core/datos/seed'

// Datos completos que llegan del formulario de registro.
export interface DatosRegistro {
  nombre: string
  apellido: string
  // Teléfono con país: el país elegido es la fuente de verdad (countryCode ISO).
  countryCode: string
  countryName: string
  callingCode: string
  telefono: string // número nacional
  // Documento de identidad según el país.
  tipoDocumento: string
  documentoNumero: string
  documentoComplemento: string // Bolivia (opcional)
  prefijoDocumento: string // Venezuela (V/E)
  correo: string
  contrasena: string
  confirmar: string
  // Dirección territorial dinámica según el país (Fase 2).
  ubicacion: Ubicacion
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
    // Validación COMPLETA (la misma del formulario) como verificación final
    // antes de guardar. Nunca confiamos solo en lo que llega del formulario.
    const correos = usuarios.map((u) => u.correo)
    const validacion = validarRegistroCompleto(datos, correos)
    if (!validacion.ok) {
      const primer = validacion.orden.find((campo) => validacion.errores[campo])
      return {
        ok: false,
        mensaje: primer ? validacion.errores[primer]! : 'Revisa los datos del formulario.',
      }
    }

    // Validación de la dirección (según el país).
    const valUbic = validarUbicacion(datos.countryCode, datos.ubicacion)
    if (!valUbic.ok) {
      return { ok: false, mensaje: Object.values(valUbic.errores)[0] ?? 'Revisa los datos de dirección.' }
    }

    // Documento normalizado (string, sin separadores, conserva ceros) y su formato visual.
    const doc = validateIdentityDocument({
      countryCode: datos.countryCode,
      documentCode: datos.tipoDocumento,
      value: datos.documentoNumero,
      complement: datos.documentoComplemento,
      prefix: datos.prefijoDocumento,
    })
    const display = formatIdentityDocument(datos.countryCode, datos.tipoDocumento, datos.documentoNumero)
    const telNacional = datos.telefono.replace(/\D/g, '')
    const u = datos.ubicacion

    const nuevo: Usuario = {
      idPersona: 'P-' + Date.now(),
      idUsuario: 'U-' + Date.now(),
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      telefono: telNacional,
      dni: doc.normalizedValue, // documento normalizado (compatibilidad con el modelo Persona)
      correo: datos.correo.trim(),
      contrasena: datos.contrasena,
      // Compatibilidad con el modelo: nombres legibles del nivel principal y del más específico.
      direccion: u.direccion.trim(),
      distrito: (u.nivel3?.nombre || u.nivel2.nombre || '').trim(),
      departamento: u.nivel1.nombre.trim(),
      rol: datos.rol,
      estado: 'activo',
      paisCodigo: datos.countryCode,
      paisNombre: datos.countryName,
      prefijoTelefonico: datos.callingCode,
      telefonoInternacional: (datos.callingCode || '') + telNacional,
      tipoDocumento: datos.tipoDocumento,
      documentoDisplay: datos.prefijoDocumento ? `${datos.prefijoDocumento}-${display}` : display,
      documentoComplemento: datos.documentoComplemento || undefined,
      // Dirección territorial estructurada (códigos como texto, conservan ceros).
      codigoPostal: u.codigoPostal || undefined,
      nivel1Tipo: u.nivel1.tipo || undefined,
      nivel1Codigo: u.nivel1.codigo || undefined,
      nivel1Nombre: u.nivel1.nombre || undefined,
      nivel2Tipo: u.nivel2.tipo || undefined,
      nivel2Codigo: u.nivel2.codigo || undefined,
      nivel2Nombre: u.nivel2.nombre || undefined,
      nivel3Tipo: u.nivel3?.tipo || undefined,
      nivel3Codigo: u.nivel3?.codigo || undefined,
      nivel3Nombre: u.nivel3?.nombre || undefined,
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
