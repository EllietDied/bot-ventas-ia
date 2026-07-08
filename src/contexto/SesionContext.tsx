import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Usuario, Rol, Sexo } from '../core/modelos/Usuario'
import { iniciarSesion, Resultado } from '../core/servicios/AuthService'
import { validarRegistroCompleto } from '../utils/validacionesRegistro'
import { validateIdentityDocument } from '../utils/validateIdentityDocument'
import { formatIdentityDocument } from '../utils/formatIdentityDocument'
import { validarUbicacion } from '../utils/validarUbicacion'
import { Ubicacion } from '../config/addressCountryConfig'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { USUARIOS_INICIALES } from '../core/datos/seed'
import { usarSupabase } from '../core/datos/supabase'
import {
  loginSupabase,
  registrarSupabase,
  logoutSupabase,
  obtenerUsuarioActual,
  escucharCambiosSesion,
} from '../core/servicios/SupabaseAuthService'
import { limpiarChatSupabase } from '../core/servicios/ChatService'

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
  sexo: Sexo | '' // '' = aún no elegido (lo valida el registro)
}

// Qué expone el contexto de sesión.
interface SesionContextType {
  usuarioActual: Usuario | null
  cargandoSesion: boolean
  usuarios: Usuario[]
  login: (correo: string, contrasena: string) => Promise<Resultado>
  registrar: (datos: DatosRegistro) => Promise<Resultado>
  logout: () => void
}

const SesionContext = createContext<SesionContextType | undefined>(undefined)

export function SesionProvider({ children }: { children: ReactNode }) {
  // Lista de usuarios registrados (se carga desde localStorage).
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => cargar('usuarios', USUARIOS_INICIALES))
  // Usuario que tiene la sesión iniciada.
  // Con Supabase, la sesión la maneja Supabase (no se lee de localStorage).
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() =>
    usarSupabase() ? null : cargar<Usuario | null>('sesion', null),
  )
  // En modo Supabase la sesión se restaura de forma asíncrona al cargar la app.
  // Mientras tanto, "cargandoSesion" evita que las rutas protegidas rebote al
  // usuario (en modo local la sesión es síncrona, así que arranca en false).
  const [cargandoSesion, setCargandoSesion] = useState<boolean>(() => usarSupabase())

  // Guardamos la lista de usuarios y la sesión en localStorage SOLO en el modo local.
  useEffect(() => guardar('usuarios', usuarios), [usuarios])
  useEffect(() => {
    if (!usarSupabase()) guardar('sesion', usuarioActual)
  }, [usuarioActual])

  // Con Supabase: al cargar restauramos la sesión y escuchamos sus cambios.
  useEffect(() => {
    if (!usarSupabase()) return
    let activo = true
    obtenerUsuarioActual().then((u) => {
      if (!activo) return
      if (u) setUsuarioActual(u)
      setCargandoSesion(false) // terminó la restauración (haya sesión o no)
    })
    const cancelar = escucharCambiosSesion((u) => {
      if (activo) setUsuarioActual(u)
    })
    return () => {
      activo = false
      cancelar()
    }
  }, [])

  async function login(correo: string, contrasena: string): Promise<Resultado> {
    // Modo Supabase (autenticación real).
    if (usarSupabase()) {
      const r = await loginSupabase(correo, contrasena)
      if (r.ok && r.usuario) setUsuarioActual(r.usuario)
      return { ok: r.ok, mensaje: r.mensaje }
    }
    // Modo local (sin conexión).
    const usuario = iniciarSesion(correo, contrasena, usuarios)
    if (!usuario) return { ok: false, mensaje: 'Correo o contraseña incorrectos.' }
    setUsuarioActual(usuario)
    return { ok: true, mensaje: `Bienvenido, ${usuario.nombre}.` }
  }

  async function registrar(datos: DatosRegistro): Promise<Resultado> {
    // Validación COMPLETA (la misma del formulario) como verificación final.
    // El correo duplicado: en local lo revisamos aquí; con Supabase lo controla Supabase.
    const supa = usarSupabase()
    const correos = supa ? [] : usuarios.map((u) => u.correo)
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

    // Datos derivados (comunes a ambos modos): documento normalizado y su formato visual.
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
    const documentoDisplay = datos.prefijoDocumento ? `${datos.prefijoDocumento}-${display}` : display

    // ----- Modo Supabase: los datos del perfil viajan como metadata (los copia el trigger) -----
    if (supa) {
      const metadata: Record<string, string> = {
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        telefono: telNacional,
        prefijo_telefonico: datos.callingCode,
        telefono_internacional: (datos.callingCode || '') + telNacional,
        rol: datos.rol,
        sexo: datos.sexo || '',
        pais_codigo: datos.countryCode,
        pais_nombre: datos.countryName,
        tipo_documento: datos.tipoDocumento,
        documento_numero: doc.normalizedValue,
        documento_display: documentoDisplay,
        documento_complemento: datos.documentoComplemento || '',
        codigo_postal: u.codigoPostal || '',
        nivel1_tipo: u.nivel1.tipo,
        nivel1_codigo: u.nivel1.codigo,
        nivel1_nombre: u.nivel1.nombre,
        nivel2_tipo: u.nivel2.tipo,
        nivel2_codigo: u.nivel2.codigo,
        nivel2_nombre: u.nivel2.nombre,
        nivel3_tipo: u.nivel3?.tipo || '',
        nivel3_codigo: u.nivel3?.codigo || '',
        nivel3_nombre: u.nivel3?.nombre || '',
        direccion: u.direccion.trim(),
      }
      const r = await registrarSupabase(datos.correo, datos.contrasena, metadata)
      if (r.ok && r.usuario) setUsuarioActual(r.usuario)
      return { ok: r.ok, mensaje: r.mensaje }
    }

    // ----- Modo local (sin conexión) -----
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
      sexo: datos.sexo || undefined,
      estado: 'activo',
      paisCodigo: datos.countryCode,
      paisNombre: datos.countryName,
      prefijoTelefonico: datos.callingCode,
      telefonoInternacional: (datos.callingCode || '') + telNacional,
      tipoDocumento: datos.tipoDocumento,
      documentoDisplay,
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

  async function logout() {
    // Borramos la conversación del asistente al salir (comprador y vendedor).
    // En Supabase debe hacerse ANTES de cerrar sesión: mientras el token sigue
    // activo, para que las reglas de seguridad (RLS) permitan el borrado.
    if (usuarioActual && usarSupabase()) {
      try {
        await limpiarChatSupabase(usuarioActual.idUsuario)
      } catch {
        /* si el borrado en la nube falla, igual cerramos la sesión */
      }
    }
    // Vaciamos SIEMPRE la copia local del chat (ambos roles), en cualquier modo,
    // para que no reaparezca al volver a entrar.
    guardar('asistente_chat_comprador', [])
    guardar('asistente_chat_vendedor', [])
    if (usarSupabase()) await logoutSupabase()
    setUsuarioActual(null)
  }

  return (
    <SesionContext.Provider
      value={{ usuarioActual, cargandoSesion, usuarios, login, registrar, logout }}
    >
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
