import { Usuario } from '../modelos/Usuario'

// Resultado de una validación (sirve para mostrar mensajes de error).
export interface Resultado {
  ok: boolean
  mensaje: string
}

// ALGORITMO IniciarSesion:
// busca un usuario cuyo correo y contraseña coincidan.
export function iniciarSesion(
  correo: string,
  contrasena: string,
  usuarios: Usuario[],
): Usuario | null {
  const usuario = usuarios.find((u) => u.correo === correo && u.contrasena === contrasena)
  return usuario ?? null
}

// Datos que llegan desde el formulario de registro.
export interface DatosRegistroBasicos {
  nombre: string
  apellido: string
  correo: string
  contrasena: string
  confirmar: string
}

// Validaciones del registro, con mensajes de error claros.
export function validarRegistro(datos: DatosRegistroBasicos, usuarios: Usuario[]): Resultado {
  if (!datos.nombre.trim() || !datos.apellido.trim()) {
    return { ok: false, mensaje: 'El nombre y el apellido son obligatorios.' }
  }
  if (!validarCorreo(datos.correo)) {
    return { ok: false, mensaje: 'El correo no tiene un formato válido.' }
  }
  if (usuarios.some((u) => u.correo === datos.correo)) {
    return { ok: false, mensaje: 'Ya existe una cuenta con ese correo.' }
  }
  if (datos.contrasena.length < 6) {
    return { ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres.' }
  }
  if (datos.contrasena !== datos.confirmar) {
    return { ok: false, mensaje: 'Las contraseñas no coinciden.' }
  }
  return { ok: true, mensaje: 'Validación correcta.' }
}

// Validación simple del formato de un correo electrónico.
export function validarCorreo(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
}
