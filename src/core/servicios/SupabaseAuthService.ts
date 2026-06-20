// Servicio de autenticación con Supabase (modo "real").
// Solo se usa cuando el interruptor está activado; si no, la app usa AuthService
// (modo local con localStorage). La contraseña la maneja Supabase Auth: nunca se
// guarda en la app.
import { supabase } from '../datos/supabase'
import { Usuario, Rol } from '../modelos/Usuario'
import { Resultado } from './AuthService'

// Una fila de la tabla "perfiles" (todas sus columnas son texto o null).
type FilaPerfil = Record<string, string | null>

// Resultado de autenticación que, además, puede traer el usuario ya cargado.
export interface ResultadoAuth extends Resultado {
  usuario?: Usuario | null
}

// Convierte una fila de "perfiles" (Supabase) al modelo Usuario de la app.
export function mapPerfilAUsuario(perfil: FilaPerfil, correo: string): Usuario {
  return {
    idPersona: perfil.id ?? '',
    idUsuario: perfil.id ?? '',
    nombre: perfil.nombre ?? '',
    apellido: perfil.apellido ?? '',
    telefono: perfil.telefono ?? '',
    dni: perfil.documento_numero ?? '',
    correo,
    contrasena: '', // la maneja Supabase Auth; nunca se guarda aquí
    direccion: perfil.direccion ?? '',
    distrito: perfil.nivel3_nombre || perfil.nivel2_nombre || '',
    departamento: perfil.nivel1_nombre ?? '',
    rol: (perfil.rol as Rol) ?? 'comprador',
    estado: perfil.estado ?? 'activo',
    paisCodigo: perfil.pais_codigo ?? undefined,
    paisNombre: perfil.pais_nombre ?? undefined,
    prefijoTelefonico: perfil.prefijo_telefonico ?? undefined,
    telefonoInternacional: perfil.telefono_internacional ?? undefined,
    tipoDocumento: perfil.tipo_documento ?? undefined,
    documentoDisplay: perfil.documento_display ?? undefined,
    documentoComplemento: perfil.documento_complemento ?? undefined,
    codigoPostal: perfil.codigo_postal ?? undefined,
    nivel1Tipo: perfil.nivel1_tipo ?? undefined,
    nivel1Codigo: perfil.nivel1_codigo ?? undefined,
    nivel1Nombre: perfil.nivel1_nombre ?? undefined,
    nivel2Tipo: perfil.nivel2_tipo ?? undefined,
    nivel2Codigo: perfil.nivel2_codigo ?? undefined,
    nivel2Nombre: perfil.nivel2_nombre ?? undefined,
    nivel3Tipo: perfil.nivel3_tipo ?? undefined,
    nivel3Codigo: perfil.nivel3_codigo ?? undefined,
    nivel3Nombre: perfil.nivel3_nombre ?? undefined,
  }
}

// Carga el usuario de la sesión actual (su cuenta de Auth + su perfil).
export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  if (!supabase) return null
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil) return null
  return mapPerfilAUsuario(perfil as FilaPerfil, user.email ?? '')
}

// Inicia sesión con correo y contraseña.
export async function loginSupabase(correo: string, contrasena: string): Promise<ResultadoAuth> {
  if (!supabase) return { ok: false, mensaje: 'Supabase no está configurado.' }
  const { error } = await supabase.auth.signInWithPassword({
    email: correo.trim(),
    password: contrasena,
  })
  if (error) return { ok: false, mensaje: 'Correo o contraseña incorrectos.' }
  const usuario = await obtenerUsuarioActual()
  return { ok: true, mensaje: `Bienvenido, ${usuario?.nombre ?? ''}.`, usuario }
}

// Registra un usuario. Los datos del perfil viajan como "metadata"; el trigger
// crear_perfil() de la base los copia a la tabla "perfiles".
export async function registrarSupabase(
  correo: string,
  contrasena: string,
  metadata: Record<string, string>,
): Promise<ResultadoAuth> {
  if (!supabase) return { ok: false, mensaje: 'Supabase no está configurado.' }
  const { data, error } = await supabase.auth.signUp({
    email: correo.trim(),
    password: contrasena,
    options: { data: metadata },
  })
  if (error) {
    const mensaje = /already|registered|exist/i.test(error.message)
      ? 'Ya existe una cuenta con ese correo.'
      : 'No se pudo crear la cuenta. Inténtalo de nuevo.'
    return { ok: false, mensaje }
  }
  // Si "Confirmar correo" está activado en Supabase, todavía no hay sesión.
  if (!data.session) {
    return { ok: true, mensaje: 'Cuenta creada. Revisa tu correo para confirmarla.', usuario: null }
  }
  const usuario = await obtenerUsuarioActual()
  return { ok: true, mensaje: 'Cuenta creada correctamente.', usuario }
}

// Cierra la sesión.
export async function logoutSupabase(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

// Escucha cambios de sesión (inicio/cierre en otra pestaña, expiración, etc.).
// Devuelve una función para cancelar la suscripción.
export function escucharCambiosSesion(cb: (usuario: Usuario | null) => void): () => void {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange(async (_evento, session) => {
    cb(session ? await obtenerUsuarioActual() : null)
  })
  return () => data.subscription.unsubscribe()
}
