// Servicio de autenticación con Supabase (modo "real").
// Solo se usa cuando el interruptor está activado; si no, la app usa AuthService
// (modo local con localStorage). La contraseña la maneja Supabase Auth: nunca se
// guarda en la app.
import { supabase } from '../datos/supabase'
import { Usuario, Rol, Sexo } from '../modelos/Usuario'
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
    sexo: (perfil.sexo as Sexo) || undefined,
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

// Carga el perfil (tabla "perfiles") de una cuenta de Auth y lo mapea a Usuario.
async function cargarPerfil(user: { id: string; email?: string | null }): Promise<Usuario | null> {
  if (!supabase) return null
  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
  if (!perfil) return null
  return mapPerfilAUsuario(perfil as FilaPerfil, user.email ?? '')
}

// Carga el usuario de la sesión actual (su cuenta de Auth + su perfil).
export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  if (!supabase) return null
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return cargarPerfil(user)
}

// Inicia sesión con correo y contraseña.
export async function loginSupabase(correo: string, contrasena: string): Promise<ResultadoAuth> {
  if (!supabase) return { ok: false, mensaje: 'Supabase no está configurado.' }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo.trim(),
    password: contrasena,
  })
  if (error || !data.user) return { ok: false, mensaje: 'Correo o contraseña incorrectos.' }
  // Usamos el usuario que ya devolvió el login (no volvemos a llamar getUser).
  const usuario = await cargarPerfil(data.user)
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
    // Mensaje claro según el motivo real que devuelve Supabase.
    let mensaje: string
    if (error.status === 429 || /rate limit|security purposes/i.test(error.message)) {
      mensaje = 'Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.'
    } else if (/already|registered|exist/i.test(error.message)) {
      mensaje = 'Ya existe una cuenta con ese correo. Inicia sesión.'
    } else if (/password/i.test(error.message)) {
      mensaje = 'La contraseña no cumple los requisitos mínimos.'
    } else {
      mensaje = `No se pudo crear la cuenta: ${error.message}`
    }
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
  const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
    const user = session?.user
    if (!user) {
      cb(null)
      return
    }
    // IMPORTANTE: dentro de onAuthStateChange NO se deben llamar otras funciones de
    // auth (como getUser): puede bloquear la sesión (deadlock). Usamos session.user y
    // diferimos la consulta del perfil con setTimeout para salir del callback.
    setTimeout(() => {
      cargarPerfil(user).then(cb)
    }, 0)
  })
  return () => data.subscription.unsubscribe()
}

// Envía un correo con un enlace para restablecer la contraseña.
export async function recuperarContrasena(correo: string): Promise<Resultado> {
  if (!supabase) return { ok: false, mensaje: 'La recuperación por correo requiere Supabase.' }
  const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
    redirectTo: `${window.location.origin}/restablecer`,
  })
  if (error) {
    const mensaje = /rate|seconds|security/i.test(error.message)
      ? 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
      : 'No se pudo enviar el correo. Verifica la dirección.'
    return { ok: false, mensaje }
  }
  return {
    ok: true,
    mensaje: 'Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo (y la carpeta de spam).',
  }
}

// Cambia la contraseña del usuario en la sesión de recuperación actual.
export async function actualizarContrasena(nueva: string): Promise<Resultado> {
  if (!supabase) return { ok: false, mensaje: 'Requiere Supabase.' }
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) {
    const mensaje = /6|short|weak|password|least/i.test(error.message)
      ? 'La contraseña no cumple los requisitos (mínimo 6 caracteres).'
      : 'No se pudo actualizar. Abre de nuevo el enlace del correo e inténtalo otra vez.'
    return { ok: false, mensaje }
  }
  return { ok: true, mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' }
}
