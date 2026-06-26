// Validaciones de los campos del registro (nombre, correo, contraseña) y un
// validador completo que reúne todo (lo usan el formulario y el guardado).
import { validateIdentityDocument } from './validateIdentityDocument'
import { getPais } from '../config/paises'

// Solo letras (incluye vocales con acento y ñ) y espacios. Quita el resto.
// Se usa en onChange para que el usuario no pueda escribir números ni símbolos.
export function filtrarSoloLetras(valor: string): string {
  return valor.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '')
}

// ¿Es un nombre/apellido válido? Al menos 2 letras y solo letras/espacios.
export function esNombreValido(valor: string): boolean {
  const limpio = valor.trim()
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(limpio) && limpio.length >= 2
}

// Correo con un formato razonable.
export function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((correo ?? '').trim())
}

// Solo números (para el teléfono). Quita todo lo que no sea dígito.
export function filtrarSoloNumeros(valor: string): string {
  return valor.replace(/\D/g, '')
}

// ----- Fuerza de la contraseña -----
export interface FuerzaContrasena {
  puntaje: number // 0..4
  nivel: 'vacia' | 'debil' | 'media' | 'fuerte'
  aceptable: boolean // mínimo para poder registrarse
  sugerencias: string[]
}

// Evalúa qué tan segura es la contraseña y da sugerencias.
// Mínimo aceptable: 8+ caracteres con al menos una letra y un número.
export function evaluarContrasena(valor: string): FuerzaContrasena {
  const sugerencias: string[] = []
  let puntaje = 0

  if (valor.length >= 8) puntaje++
  else sugerencias.push('Usa al menos 8 caracteres')

  if (/[a-z]/.test(valor) && /[A-Z]/.test(valor)) puntaje++
  else sugerencias.push('Combina mayúsculas y minúsculas')

  if (/\d/.test(valor)) puntaje++
  else sugerencias.push('Agrega al menos un número')

  if (/[^A-Za-z0-9]/.test(valor)) puntaje++
  else sugerencias.push('Agrega un símbolo (ej. ! @ #)')

  const aceptable = valor.length >= 8 && /[A-Za-z]/.test(valor) && /\d/.test(valor)

  let nivel: FuerzaContrasena['nivel'] = 'vacia'
  if (valor.length === 0) nivel = 'vacia'
  else if (!aceptable) nivel = 'debil'
  else if (puntaje >= 4) nivel = 'fuerte'
  else nivel = 'media'

  return { puntaje, nivel, aceptable, sugerencias }
}

// ----- Validación completa del registro -----
// Datos que necesita el validador (es un subconjunto de DatosRegistro).
export interface DatosRegistroValidar {
  nombre: string
  apellido: string
  countryCode: string
  telefono: string
  tipoDocumento: string
  documentoNumero: string
  documentoComplemento: string
  prefijoDocumento: string
  correo: string
  contrasena: string
  confirmar: string
}

export interface ResultadoValidacion {
  ok: boolean
  // Errores por campo (clave = nombre del campo). Vacío si todo está bien.
  errores: Partial<Record<keyof DatosRegistroValidar, string>>
  // Orden de los campos (para llevar el foco al primero con error).
  orden: (keyof DatosRegistroValidar)[]
}

// Valida TODOS los campos del registro y devuelve los errores por campo.
// correosExistentes: correos ya registrados (para evitar duplicados).
export function validarRegistroCompleto(
  d: DatosRegistroValidar,
  correosExistentes: string[],
): ResultadoValidacion {
  const errores: Partial<Record<keyof DatosRegistroValidar, string>> = {}
  const orden: (keyof DatosRegistroValidar)[] = [
    'nombre',
    'apellido',
    'telefono',
    'documentoNumero',
    'correo',
    'contrasena',
    'confirmar',
  ]

  if (!esNombreValido(d.nombre)) {
    errores.nombre = 'El nombre solo debe contener letras.'
  }
  if (!esNombreValido(d.apellido)) {
    errores.apellido = 'El apellido solo debe contener letras.'
  }

  // Teléfono: país elegido + número (longitud exacta si el país la define; si no, 6 a 15 dígitos).
  const tel = filtrarSoloNumeros(d.telefono)
  const telLongitud = getPais(d.countryCode)?.telefonoLongitud
  if (!d.countryCode) {
    errores.telefono = 'Selecciona el país de tu teléfono.'
  } else if (telLongitud) {
    if (tel.length !== telLongitud) {
      errores.telefono = `El teléfono debe tener exactamente ${telLongitud} dígitos.`
    }
  } else if (tel.length < 6 || tel.length > 15) {
    errores.telefono = 'Ingresa un número de teléfono válido (entre 6 y 15 dígitos).'
  }

  // Documento de identidad según el país.
  const doc = validateIdentityDocument({
    countryCode: d.countryCode,
    documentCode: d.tipoDocumento,
    value: d.documentoNumero,
    complement: d.documentoComplemento,
    prefix: d.prefijoDocumento,
  })
  if (!doc.isValid) {
    errores.documentoNumero = doc.errorMessage ?? 'Revisa tu número de documento.'
  }

  // Correo válido y no repetido.
  if (!esCorreoValido(d.correo)) {
    errores.correo = 'El correo no tiene un formato válido.'
  } else if (correosExistentes.includes(d.correo.trim())) {
    errores.correo = 'Ya existe una cuenta con ese correo.'
  }

  // Contraseña segura y confirmación coincidente.
  if (!evaluarContrasena(d.contrasena).aceptable) {
    errores.contrasena = 'La contraseña debe tener mínimo 8 caracteres, con letras y números.'
  }
  if (d.confirmar !== d.contrasena) {
    errores.confirmar = 'Las contraseñas no coinciden.'
  }

  return { ok: Object.keys(errores).length === 0, errores, orden }
}
