// Configuración CENTRALIZADA de documentos de identidad por país.
// Toda la lógica vive aquí como datos (no if/switch dispersos): cada documento
// describe cómo se escribe, se normaliza y se valida. Para agregar un país o
// documento basta con añadir una entrada a la lista DOCUMENTOS.
//
// Cada regla indica su origen y si todavía requiere revisión oficial. Cuando no
// hay una regla confirmada, se usa una validación poco estricta para NO bloquear
// documentos válidos (requiresOfficialReview: true, strictValidation: false).

// Tipo de los validadores de dígito verificador (se aplican sobre el valor normalizado).
export type CheckDigit = 'chileRun' | 'brazilCpf' | 'ecuadorCi' | 'uruguayCi' | 'argentinaCuit'

export interface ConfigDocumento {
  countryCode: string
  countryName: string
  documentCode: string // identificador interno (DNI, CEDULA, RUN, CPF...)
  documentName: string // etiqueta visible
  characterType: 'numeric' | 'alphanumeric'
  minLength: number
  maxLength: number
  exactLength?: number
  inputMode: 'numeric' | 'text' // teclado móvil sugerido
  allowedRegex: RegExp // qué caracteres se permiten (sobre el valor ya normalizado)
  finalRegex: RegExp // formato final válido (sobre el valor normalizado)
  placeholder: string
  helpText: string
  normalize: (valor: string) => string
  validateCheckDigit: boolean
  checkDigit?: CheckDigit
  prefixes?: string[] // Venezuela: prefijo en selector aparte (V, E)
  hasComplement?: boolean // Bolivia: complemento alfanumérico opcional
  mensajeError?: string // mensaje específico de longitud/formato
  requiresOfficialReview: boolean
  strictValidation: boolean
  sourceUrl: string
  reviewedAt: string // YYYY-MM-DD
}

// ----- Normalizadores reutilizables -----
const soloNumeros = (v: string) => v.replace(/\D/g, '')
const alfanumerico = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '')
const alfanumericoGuion = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/g, '')
// Chile: mayúsculas, conserva dígitos y la letra K; quita puntos, guion y espacios.
const normalizarChile = (v: string) => v.toUpperCase().replace(/[^0-9K]/g, '')

// ----- Builders para no repetir código -----

// Pasaporte: siempre un tipo de documento independiente y alfanumérico.
function pasaporte(countryCode: string, countryName: string): ConfigDocumento {
  return {
    countryCode,
    countryName,
    documentCode: 'PASAPORTE',
    documentName: 'Pasaporte',
    characterType: 'alphanumeric',
    minLength: 5,
    maxLength: 20,
    inputMode: 'text',
    allowedRegex: /^[A-Z0-9]+$/,
    finalRegex: /^[A-Z0-9]{5,20}$/,
    placeholder: 'AB123456',
    helpText: 'Ingresa el número de tu pasaporte (letras y números).',
    normalize: alfanumerico,
    validateCheckDigit: false,
    requiresOfficialReview: true,
    strictValidation: false,
    sourceUrl: '',
    reviewedAt: '2026-06-19',
  }
}

// Documento genérico para países/documentos sin regla confirmada.
function generico(countryCode: string, countryName: string): ConfigDocumento {
  return {
    countryCode,
    countryName,
    documentCode: 'DOC',
    documentName: 'Documento de identidad',
    characterType: 'alphanumeric',
    minLength: 5,
    maxLength: 20,
    inputMode: 'text',
    allowedRegex: /^[A-Z0-9-]+$/,
    finalRegex: /^[A-Z0-9-]{5,20}$/,
    placeholder: '12345678',
    helpText: 'Ingresa tu número de documento.',
    normalize: alfanumericoGuion,
    validateCheckDigit: false,
    requiresOfficialReview: true,
    strictValidation: false,
    sourceUrl: '',
    reviewedAt: '2026-06-19',
  }
}

// ----- Configuración por país -----
export const DOCUMENTOS: ConfigDocumento[] = [
  // Perú
  {
    countryCode: 'PE', countryName: 'Perú', documentCode: 'DNI', documentName: 'DNI',
    characterType: 'numeric', minLength: 8, maxLength: 8, exactLength: 8, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{8}$/, placeholder: '12345678',
    helpText: 'Ingresa los 8 números de tu DNI.', normalize: soloNumeros,
    validateCheckDigit: false, mensajeError: 'El DNI peruano debe contener exactamente 8 números.',
    requiresOfficialReview: false, strictValidation: true,
    sourceUrl: 'https://www.reniec.gob.pe/', reviewedAt: '2026-06-19',
  },
  {
    countryCode: 'PE', countryName: 'Perú', documentCode: 'CE', documentName: 'Carné de extranjería',
    characterType: 'alphanumeric', minLength: 9, maxLength: 12, inputMode: 'text',
    allowedRegex: /^[A-Z0-9]+$/, finalRegex: /^[A-Z0-9]{9,12}$/, placeholder: '001234567',
    helpText: 'Ingresa tu carné de extranjería (números y, a veces, letras).', normalize: alfanumerico,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.migraciones.gob.pe/', reviewedAt: '2026-06-19',
  },
  pasaporte('PE', 'Perú'),

  // Ecuador
  {
    countryCode: 'EC', countryName: 'Ecuador', documentCode: 'CEDULA', documentName: 'Cédula',
    characterType: 'numeric', minLength: 10, maxLength: 10, exactLength: 10, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{10}$/, placeholder: '0912345678',
    helpText: 'Ingresa los 10 números de tu cédula.', normalize: soloNumeros,
    validateCheckDigit: true, checkDigit: 'ecuadorCi',
    mensajeError: 'La cédula ecuatoriana debe contener exactamente 10 números.',
    requiresOfficialReview: false, strictValidation: true,
    sourceUrl: 'https://www.registrocivil.gob.ec/', reviewedAt: '2026-06-19',
  },
  pasaporte('EC', 'Ecuador'),

  // Chile
  {
    countryCode: 'CL', countryName: 'Chile', documentCode: 'RUN', documentName: 'RUN / RUT',
    characterType: 'alphanumeric', minLength: 7, maxLength: 9, inputMode: 'text',
    allowedRegex: /^[0-9K]+$/, finalRegex: /^[0-9]{6,8}[0-9K]$/, placeholder: '12.345.678-5',
    helpText: 'Ingresa tu RUN con dígito verificador; puede terminar en K.',
    normalize: normalizarChile, validateCheckDigit: true, checkDigit: 'chileRun',
    mensajeError: 'Ingresa un RUN válido (cuerpo + dígito verificador).',
    requiresOfficialReview: false, strictValidation: true,
    sourceUrl: 'https://www.registrocivil.cl/', reviewedAt: '2026-06-19',
  },
  pasaporte('CL', 'Chile'),

  // Colombia (acepta cédulas antiguas y nuevas: 6 a 10 dígitos)
  {
    countryCode: 'CO', countryName: 'Colombia', documentCode: 'CC', documentName: 'Cédula de ciudadanía',
    characterType: 'numeric', minLength: 6, maxLength: 10, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{6,10}$/, placeholder: '79123456',
    helpText: 'Ingresa tu número de cédula, sin puntos ni espacios.', normalize: soloNumeros,
    validateCheckDigit: false,
    mensajeError: 'Ingresa un número de cédula colombiano válido, sin puntos ni espacios.',
    requiresOfficialReview: false, strictValidation: true,
    sourceUrl: 'https://www.registraduria.gov.co/', reviewedAt: '2026-06-19',
  },
  pasaporte('CO', 'Colombia'),

  // Argentina (DNI 7-8 dígitos; CUIT/CUIL como documento aparte)
  {
    countryCode: 'AR', countryName: 'Argentina', documentCode: 'DNI', documentName: 'DNI',
    characterType: 'numeric', minLength: 7, maxLength: 8, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{7,8}$/, placeholder: '12345678',
    helpText: 'Ingresa tu DNI (7 u 8 números), sin puntos.', normalize: soloNumeros,
    validateCheckDigit: false, requiresOfficialReview: false, strictValidation: true,
    sourceUrl: 'https://www.argentina.gob.ar/interior/renaper', reviewedAt: '2026-06-19',
  },
  {
    countryCode: 'AR', countryName: 'Argentina', documentCode: 'CUIT', documentName: 'CUIT / CUIL',
    characterType: 'numeric', minLength: 11, maxLength: 11, exactLength: 11, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{11}$/, placeholder: '20-12345678-6',
    helpText: 'Ingresa los 11 números de tu CUIT/CUIL (puedes escribir los guiones).',
    normalize: soloNumeros, validateCheckDigit: true, checkDigit: 'argentinaCuit',
    requiresOfficialReview: false, strictValidation: true,
    sourceUrl: 'https://www.afip.gob.ar/', reviewedAt: '2026-06-19',
  },
  pasaporte('AR', 'Argentina'),

  // Bolivia (CI numérico + complemento alfanumérico opcional, en campo aparte)
  {
    countryCode: 'BO', countryName: 'Bolivia', documentCode: 'CI', documentName: 'Cédula de identidad',
    characterType: 'numeric', minLength: 5, maxLength: 9, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{5,9}$/, placeholder: '1234567', hasComplement: true,
    helpText: 'Ingresa el número de tu CI; el complemento es opcional.', normalize: soloNumeros,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.segip.gob.bo/', reviewedAt: '2026-06-19',
  },
  pasaporte('BO', 'Bolivia'),

  // Venezuela (prefijo V/E en selector aparte; número solo dígitos)
  {
    countryCode: 'VE', countryName: 'Venezuela', documentCode: 'CEDULA', documentName: 'Cédula',
    characterType: 'numeric', minLength: 6, maxLength: 9, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{6,9}$/, placeholder: '12345678',
    prefixes: ['V', 'E'], helpText: 'Selecciona V o E e ingresa tu número de cédula.',
    normalize: soloNumeros, validateCheckDigit: false,
    requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.saren.gob.ve/', reviewedAt: '2026-06-19',
  },
  pasaporte('VE', 'Venezuela'),

  // Uruguay (CI con dígito verificador)
  {
    countryCode: 'UY', countryName: 'Uruguay', documentCode: 'CI', documentName: 'Cédula',
    characterType: 'numeric', minLength: 7, maxLength: 8, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{7,8}$/, placeholder: '1.234.567-2',
    helpText: 'Ingresa tu cédula con su dígito verificador.', normalize: soloNumeros,
    validateCheckDigit: true, checkDigit: 'uruguayCi',
    requiresOfficialReview: false, strictValidation: true,
    sourceUrl: 'https://www.gub.uy/direccion-nacional-identificacion-civil/', reviewedAt: '2026-06-19',
  },
  pasaporte('UY', 'Uruguay'),

  // Paraguay (longitud variable; regla conservadora pendiente de revisión)
  {
    countryCode: 'PY', countryName: 'Paraguay', documentCode: 'CI', documentName: 'Cédula',
    characterType: 'numeric', minLength: 5, maxLength: 10, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{5,10}$/, placeholder: '1234567',
    helpText: 'Ingresa tu cédula (solo números).', normalize: soloNumeros,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.policianacional.gov.py/identificaciones/', reviewedAt: '2026-06-19',
  },
  pasaporte('PY', 'Paraguay'),

  // Brasil (CPF con dos dígitos verificadores; RG como documento aparte)
  {
    countryCode: 'BR', countryName: 'Brasil', documentCode: 'CPF', documentName: 'CPF',
    characterType: 'numeric', minLength: 11, maxLength: 11, exactLength: 11, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{11}$/, placeholder: '123.456.789-09',
    helpText: 'Ingresa los 11 números de tu CPF (puedes escribir puntos y guion).',
    normalize: soloNumeros, validateCheckDigit: true, checkDigit: 'brazilCpf',
    requiresOfficialReview: false, strictValidation: true,
    sourceUrl: 'https://www.gov.br/receitafederal/', reviewedAt: '2026-06-19',
  },
  {
    countryCode: 'BR', countryName: 'Brasil', documentCode: 'RG', documentName: 'RG',
    characterType: 'alphanumeric', minLength: 5, maxLength: 14, inputMode: 'text',
    allowedRegex: /^[A-Z0-9]+$/, finalRegex: /^[A-Z0-9]{5,14}$/, placeholder: '123456789',
    helpText: 'Ingresa tu RG (el formato varía según el estado).', normalize: alfanumerico,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: '', reviewedAt: '2026-06-19',
  },
  pasaporte('BR', 'Brasil'),

  // México (CURP, validación estructural)
  {
    countryCode: 'MX', countryName: 'México', documentCode: 'CURP', documentName: 'CURP',
    characterType: 'alphanumeric', minLength: 18, maxLength: 18, exactLength: 18, inputMode: 'text',
    allowedRegex: /^[A-Z0-9]+$/,
    finalRegex: /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/,
    placeholder: 'GOMC900514HJCNRL08',
    helpText: 'Ingresa tu CURP (18 caracteres).', normalize: alfanumerico,
    validateCheckDigit: false, mensajeError: 'La CURP debe tener 18 caracteres con el formato oficial.',
    requiresOfficialReview: false, strictValidation: true,
    sourceUrl: 'https://www.gob.mx/curp/', reviewedAt: '2026-06-19',
  },
  pasaporte('MX', 'México'),

  // Centroamérica y Caribe (reglas de formato; varias pendientes de revisión)
  {
    countryCode: 'CR', countryName: 'Costa Rica', documentCode: 'CEDULA', documentName: 'Cédula',
    characterType: 'numeric', minLength: 9, maxLength: 12, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{9,12}$/, placeholder: '102340567',
    helpText: 'Ingresa tu cédula (solo números).', normalize: soloNumeros,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.tse.go.cr/', reviewedAt: '2026-06-19',
  },
  pasaporte('CR', 'Costa Rica'),
  {
    countryCode: 'PA', countryName: 'Panamá', documentCode: 'CEDULA', documentName: 'Cédula',
    characterType: 'alphanumeric', minLength: 4, maxLength: 15, inputMode: 'text',
    allowedRegex: /^[A-Z0-9-]+$/, finalRegex: /^[A-Z0-9-]{4,15}$/, placeholder: '8-123-456',
    helpText: 'Ingresa tu cédula (puede incluir letras y guiones).', normalize: alfanumericoGuion,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.tribunal-electoral.gob.pa/', reviewedAt: '2026-06-19',
  },
  pasaporte('PA', 'Panamá'),
  {
    countryCode: 'DO', countryName: 'República Dominicana', documentCode: 'CEDULA', documentName: 'Cédula',
    characterType: 'numeric', minLength: 11, maxLength: 11, exactLength: 11, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{11}$/, placeholder: '00112345678',
    helpText: 'Ingresa los 11 números de tu cédula.', normalize: soloNumeros,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://jce.gob.do/', reviewedAt: '2026-06-19',
  },
  pasaporte('DO', 'República Dominicana'),
  {
    countryCode: 'GT', countryName: 'Guatemala', documentCode: 'DPI', documentName: 'CUI / DPI',
    characterType: 'numeric', minLength: 13, maxLength: 13, exactLength: 13, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{13}$/, placeholder: '1234567890101',
    helpText: 'Ingresa los 13 números de tu CUI/DPI.', normalize: soloNumeros,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.renap.gob.gt/', reviewedAt: '2026-06-19',
  },
  pasaporte('GT', 'Guatemala'),
  {
    countryCode: 'SV', countryName: 'El Salvador', documentCode: 'DUI', documentName: 'DUI',
    characterType: 'numeric', minLength: 9, maxLength: 9, exactLength: 9, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{9}$/, placeholder: '12345678-9',
    helpText: 'Ingresa los 9 números de tu DUI (puedes escribir el guion).', normalize: soloNumeros,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.rnpn.gob.sv/', reviewedAt: '2026-06-19',
  },
  pasaporte('SV', 'El Salvador'),
  {
    countryCode: 'HN', countryName: 'Honduras', documentCode: 'DNI', documentName: 'DNI',
    characterType: 'numeric', minLength: 13, maxLength: 13, exactLength: 13, inputMode: 'numeric',
    allowedRegex: /^[0-9]+$/, finalRegex: /^[0-9]{13}$/, placeholder: '0801199012345',
    helpText: 'Ingresa los 13 números de tu DNI (puedes escribir guiones).', normalize: soloNumeros,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.rnp.hn/', reviewedAt: '2026-06-19',
  },
  pasaporte('HN', 'Honduras'),
  {
    countryCode: 'NI', countryName: 'Nicaragua', documentCode: 'CEDULA', documentName: 'Cédula',
    characterType: 'alphanumeric', minLength: 14, maxLength: 14, exactLength: 14, inputMode: 'text',
    allowedRegex: /^[0-9A-Z]+$/, finalRegex: /^[0-9]{13}[A-Z]$/, placeholder: '0011234567890A',
    helpText: 'Ingresa tu cédula (13 números y una letra final).', normalize: alfanumerico,
    validateCheckDigit: false, requiresOfficialReview: true, strictValidation: false,
    sourceUrl: 'https://www.cse.gob.ni/', reviewedAt: '2026-06-19',
  },
  pasaporte('NI', 'Nicaragua'),

  // Países sin documento nacional configurado: solo pasaporte (+ genérico por defecto).
  pasaporte('ES', 'España'),
  pasaporte('US', 'Estados Unidos'),
  pasaporte('CA', 'Canadá'),
]

// Documentos disponibles para un país. Si el país no tiene ninguno configurado,
// se ofrece un documento genérico para no bloquear el registro.
export function getDocumentosPorPais(countryCode: string): ConfigDocumento[] {
  const lista = DOCUMENTOS.filter((d) => d.countryCode === countryCode)
  if (lista.length > 0) return lista
  const pais = PAISES_NOMBRE[countryCode] ?? countryCode
  return [generico(countryCode, pais)]
}

// Configuración de un documento concreto (país + código). Cae al genérico si no existe.
export function getDocumento(countryCode: string, documentCode: string): ConfigDocumento {
  const exacto = DOCUMENTOS.find(
    (d) => d.countryCode === countryCode && d.documentCode === documentCode,
  )
  if (exacto) return exacto
  const delPais = getDocumentosPorPais(countryCode)
  return delPais[0]
}

// Nombre de país a partir del código (para el documento genérico).
const PAISES_NOMBRE: Record<string, string> = DOCUMENTOS.reduce(
  (acc, d) => {
    acc[d.countryCode] = d.countryName
    return acc
  },
  {} as Record<string, string>,
)
