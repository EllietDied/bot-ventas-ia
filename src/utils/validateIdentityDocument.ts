import { getDocumento, CheckDigit } from '../config/identityDocuments'
import { normalizeIdentityDocument } from './normalizeIdentityDocument'
import { formatIdentityDocument } from './formatIdentityDocument'
import { validarRun } from './checkDigits/chileRun'
import { validarCpf } from './checkDigits/brazilCpf'
import { validarCedulaEc } from './checkDigits/ecuadorCi'
import { validarCedulaUy } from './checkDigits/uruguayCi'
import { validarCuit } from './checkDigits/argentinaCuit'

// Códigos de error posibles (separan formato, longitud y dígito verificador).
export type CodigoErrorDocumento =
  | 'REQUIRED'
  | 'INVALID_CHARACTERS'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'INVALID_LENGTH'
  | 'INVALID_PREFIX'
  | 'INVALID_COMPLEMENT'
  | 'INVALID_CHECK_DIGIT'
  | 'UNSUPPORTED_DOCUMENT'
  | 'REQUIRES_OFFICIAL_REVIEW'

export interface ResultadoDocumento {
  isValid: boolean
  normalizedValue: string
  formattedValue: string
  errorCode: CodigoErrorDocumento | null
  errorMessage: string | null
}

export interface EntradaDocumento {
  countryCode: string
  documentCode: string
  value: string
  complement?: string // Bolivia
  prefix?: string // Venezuela
}

// Cada validador de dígito verificador trabaja sobre el valor normalizado.
const VALIDADORES_DV: Record<CheckDigit, (v: string) => boolean> = {
  chileRun: (v) => validarRun(v.slice(0, -1), v.slice(-1)),
  brazilCpf: validarCpf,
  ecuadorCi: validarCedulaEc,
  uruguayCi: validarCedulaUy,
  argentinaCuit: validarCuit,
}

// VALIDACIÓN EN DOS NIVELES:
//  1) formato (caracteres y longitud),
//  2) matemática (dígito verificador, cuando el documento lo requiere).
// (La verificación de identidad real contra un servicio oficial NO se hace aquí:
//  una expresión regular no demuestra que una identidad exista.)
export function validateIdentityDocument({
  countryCode,
  documentCode,
  value,
  complement,
  prefix,
}: EntradaDocumento): ResultadoDocumento {
  const config = getDocumento(countryCode, documentCode)
  const normalizedValue = normalizeIdentityDocument(countryCode, documentCode, value)
  const formattedValue = formatIdentityDocument(countryCode, documentCode, value)
  const base = { normalizedValue, formattedValue }

  // Requerido.
  if (normalizedValue === '') {
    return { isValid: false, ...base, errorCode: 'REQUIRED', errorMessage: 'Ingresa tu número de documento.' }
  }
  // 1a) Caracteres permitidos.
  if (!config.allowedRegex.test(normalizedValue)) {
    return {
      isValid: false,
      ...base,
      errorCode: 'INVALID_CHARACTERS',
      errorMessage: 'El documento contiene caracteres no permitidos.',
    }
  }
  // 1b) Longitud.
  if (config.exactLength && normalizedValue.length !== config.exactLength) {
    return {
      isValid: false,
      ...base,
      errorCode: 'INVALID_LENGTH',
      errorMessage: config.mensajeError ?? `Debe tener exactamente ${config.exactLength} caracteres.`,
    }
  }
  if (normalizedValue.length < config.minLength) {
    return {
      isValid: false,
      ...base,
      errorCode: 'TOO_SHORT',
      errorMessage: config.mensajeError ?? `Debe tener al menos ${config.minLength} caracteres.`,
    }
  }
  if (normalizedValue.length > config.maxLength) {
    return {
      isValid: false,
      ...base,
      errorCode: 'TOO_LONG',
      errorMessage: config.mensajeError ?? `No debe superar ${config.maxLength} caracteres.`,
    }
  }
  // 1c) Formato final (estructura).
  if (!config.finalRegex.test(normalizedValue)) {
    return {
      isValid: false,
      ...base,
      errorCode: 'INVALID_LENGTH',
      errorMessage: config.mensajeError ?? 'El formato del documento no es válido.',
    }
  }
  // 1d) Prefijo (Venezuela), cuando el documento lo usa.
  if (config.prefixes && config.prefixes.length > 0) {
    const p = (prefix ?? '').toUpperCase()
    if (!config.prefixes.includes(p)) {
      return {
        isValid: false,
        ...base,
        errorCode: 'INVALID_PREFIX',
        errorMessage: `Selecciona un prefijo válido (${config.prefixes.join(' o ')}).`,
      }
    }
  }
  // 1e) Complemento (Bolivia): opcional, pero si viene debe ser 1-2 alfanuméricos.
  if (config.hasComplement && complement && complement.trim() !== '') {
    if (!/^[A-Z0-9]{1,2}$/.test(complement.toUpperCase())) {
      return {
        isValid: false,
        ...base,
        errorCode: 'INVALID_COMPLEMENT',
        errorMessage: 'El complemento debe tener 1 o 2 caracteres alfanuméricos.',
      }
    }
  }
  // 2) Dígito verificador (cuando aplica).
  if (config.validateCheckDigit && config.checkDigit) {
    const validar = VALIDADORES_DV[config.checkDigit]
    if (!validar(normalizedValue)) {
      return {
        isValid: false,
        ...base,
        errorCode: 'INVALID_CHECK_DIGIT',
        errorMessage: 'El dígito verificador no es correcto. Revisa el número.',
      }
    }
  }

  // Formato válido. (Si la regla aún no está confirmada oficialmente, igual se
  // acepta para no bloquear documentos válidos; queda marcado en la configuración.)
  return { isValid: true, ...base, errorCode: null, errorMessage: null }
}
