import { getConfigDireccion, Ubicacion, NivelAdministrativo } from '../config/addressCountryConfig'

// Quita caracteres de control (no imprimibles) comparando por código, sin
// escribirlos literalmente en el código fuente.
function quitarControles(texto: string): string {
  let salida = ''
  for (const ch of texto) {
    const codigo = ch.charCodeAt(0)
    if (codigo >= 32 && codigo !== 127) salida += ch
  }
  return salida
}

// Limpia la dirección: recorta extremos, reduce espacios repetidos y bloquea
// etiquetas HTML y caracteres de control. NO la convierte a número ni la vacía.
export function limpiarDireccion(valor: string): string {
  const sinControles = quitarControles(valor ?? '')
  return sinControles
    .replace(/[<>]/g, '') // bloquea etiquetas HTML
    .replace(/\s+/g, ' ') // reduce espacios internos repetidos
    .trim()
}

// Errores de la ubicación, por campo (key del nivel, 'codigoPostal' o 'direccion').
export interface ResultadoUbicacion {
  ok: boolean
  errores: Record<string, string>
}

// Valida los campos de dirección según la configuración del país.
export function validarUbicacion(countryCode: string, u: Ubicacion): ResultadoUbicacion {
  const config = getConfigDireccion(countryCode)
  const errores: Record<string, string> = {}
  const niveles: (NivelAdministrativo | null)[] = [u.nivel1, u.nivel2, u.nivel3]

  // Cada nivel configurado es obligatorio.
  config.levels.forEach((lvl, i) => {
    const nivel = niveles[i]
    if (!nivel || nivel.nombre.trim() === '') {
      errores[lvl.key] = `Indica ${lvl.label.toLowerCase()}.`
    }
  })

  // Código postal (si está habilitado).
  const pc = config.postalCode
  const cp = (u.codigoPostal ?? '').trim()
  if (pc.enabled) {
    if (pc.required && cp === '') {
      errores.codigoPostal = 'Ingresa un código postal válido.'
    } else if (cp !== '' && pc.regex && !pc.regex.test(cp)) {
      errores.codigoPostal = 'El código postal no es válido.'
    }
  }

  // Dirección exacta.
  const dir = limpiarDireccion(u.direccion)
  if (dir.length < config.address.minLength) {
    errores.direccion = `Ingresa tu dirección (mínimo ${config.address.minLength} caracteres).`
  } else if (dir.length > config.address.maxLength) {
    errores.direccion = `La dirección no debe superar ${config.address.maxLength} caracteres.`
  } else if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/.test(dir)) {
    // No aceptamos una dirección formada solo por símbolos.
    errores.direccion = 'Ingresa una dirección válida.'
  }

  return { ok: Object.keys(errores).length === 0, errores }
}
