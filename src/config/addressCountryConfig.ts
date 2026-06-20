// Configuración CENTRALIZADA de los campos de dirección por país.
// Las divisiones territoriales (y sus nombres) cambian según el país: no siempre
// es "Departamento/Distrito". Aquí se definen las etiquetas, los niveles y el
// código postal de cada país. Los DATOS (listas) viven en src/data/locations.
//
// El país lo decide el selector telefónico (countryCode ISO): única fuente de verdad.

// Un nivel territorial (ej. Departamento, Provincia, Distrito...).
export interface NivelDireccion {
  key: string // identificador interno del nivel (department, province, district...)
  label: string // etiqueta visible
  placeholder: string
  dependsOn?: string // key del nivel padre (para listas dependientes)
}

// Configuración del código postal del país.
export interface ConfigCodigoPostal {
  enabled: boolean
  required: boolean
  label: string
  inputMode: 'numeric' | 'text'
  minLength?: number
  maxLength?: number
  regex?: RegExp
  placeholder?: string
}

// Configuración del campo Dirección (texto libre).
export interface ConfigDireccionTexto {
  label: string
  placeholder: string
  minLength: number
  maxLength: number
}

export interface ConfigPaisDireccion {
  countryName: string
  levels: NivelDireccion[]
  postalCode: ConfigCodigoPostal
  address: ConfigDireccionTexto
  strictTerritorialValidation: boolean // true solo si hay listas oficiales integradas
}

// ----- Tipos del valor guardado (lo que produce el formulario) -----
export interface NivelAdministrativo {
  tipo: string // key del nivel (department, region...)
  codigo: string // código oficial (UBIGEO en Perú); '' si fue texto libre
  nombre: string
}
export interface Ubicacion {
  nivel1: NivelAdministrativo
  nivel2: NivelAdministrativo
  nivel3: NivelAdministrativo | null // null cuando el país tiene solo 2 niveles
  codigoPostal: string
  direccion: string // dirección exacta (texto)
}
export const UBICACION_VACIA: Ubicacion = {
  nivel1: { tipo: '', codigo: '', nombre: '' },
  nivel2: { tipo: '', codigo: '', nombre: '' },
  nivel3: null,
  codigoPostal: '',
  direccion: '',
}

// ----- Builders para no repetir código -----
function postalNumerico(min = 4, max = 8, required = false): ConfigCodigoPostal {
  return {
    enabled: true,
    required,
    label: 'Código postal',
    inputMode: 'numeric',
    minLength: min,
    maxLength: max,
    regex: new RegExp(`^[0-9]{${min},${max}}$`),
    placeholder: '0'.repeat(min),
  }
}
function direccion(placeholder: string): ConfigDireccionTexto {
  return { label: 'Dirección', placeholder, minLength: 5, maxLength: 150 }
}
function nivel(key: string, label: string, dependsOn?: string): NivelDireccion {
  return { key, label, placeholder: `Selecciona ${label.toLowerCase()}`, dependsOn }
}

// ----- Configuración por país -----
export const CONFIG_DIRECCION: Record<string, ConfigPaisDireccion> = {
  PE: {
    countryName: 'Perú',
    levels: [
      nivel('department', 'Departamento'),
      nivel('province', 'Provincia', 'department'),
      nivel('district', 'Distrito', 'province'),
    ],
    postalCode: { ...postalNumerico(5, 5), regex: /^[0-9]{5}$/, placeholder: '15001' },
    address: direccion('Ej. Av. Los Incas 245'),
    strictTerritorialValidation: true, // hay datos reales integrados (Perú)
  },
  CL: {
    countryName: 'Chile',
    levels: [
      nivel('region', 'Región'),
      nivel('province', 'Provincia', 'region'),
      nivel('commune', 'Comuna', 'province'),
    ],
    postalCode: postalNumerico(7, 7),
    address: direccion('Ej. Av. Providencia 1234'),
    strictTerritorialValidation: false,
  },
  CO: {
    countryName: 'Colombia',
    levels: [nivel('department', 'Departamento'), nivel('municipality', 'Municipio', 'department')],
    postalCode: postalNumerico(6, 6),
    address: direccion('Ej. Carrera 15 # 45-20'),
    strictTerritorialValidation: false,
  },
  EC: {
    countryName: 'Ecuador',
    levels: [
      nivel('province', 'Provincia'),
      nivel('canton', 'Cantón', 'province'),
      nivel('parish', 'Parroquia', 'canton'),
    ],
    postalCode: postalNumerico(6, 6),
    address: direccion('Ej. Av. Amazonas 245'),
    strictTerritorialValidation: false,
  },
  AR: {
    countryName: 'Argentina',
    levels: [
      nivel('province', 'Provincia'),
      nivel('department', 'Departamento o partido', 'province'),
      nivel('locality', 'Localidad', 'department'),
    ],
    postalCode: { ...postalNumerico(4, 4), inputMode: 'text', regex: /^[A-Za-z]?[0-9]{4}[A-Za-z]{0,3}$/ },
    address: direccion('Ej. Av. Corrientes 1234'),
    strictTerritorialValidation: false,
  },
  MX: {
    countryName: 'México',
    levels: [
      nivel('state', 'Estado'),
      nivel('municipality', 'Municipio o alcaldía', 'state'),
      nivel('locality', 'Localidad o colonia', 'municipality'),
    ],
    postalCode: postalNumerico(5, 5),
    address: direccion('Ej. Calle Reforma 100'),
    strictTerritorialValidation: false,
  },
  BR: {
    countryName: 'Brasil',
    levels: [
      nivel('state', 'Estado'),
      nivel('municipality', 'Municipio', 'state'),
      nivel('neighborhood', 'Barrio', 'municipality'),
    ],
    postalCode: { ...postalNumerico(8, 8), placeholder: '01310100' },
    address: direccion('Ej. Av. Paulista 1000'),
    strictTerritorialValidation: false,
  },
  BO: {
    countryName: 'Bolivia',
    levels: [
      nivel('department', 'Departamento'),
      nivel('province', 'Provincia', 'department'),
      nivel('municipality', 'Municipio', 'province'),
    ],
    postalCode: { enabled: false, required: false, label: 'Código postal', inputMode: 'numeric' },
    address: direccion('Ej. Av. 6 de Agosto 200'),
    strictTerritorialValidation: false,
  },
  VE: {
    countryName: 'Venezuela',
    levels: [
      nivel('state', 'Estado'),
      nivel('municipality', 'Municipio', 'state'),
      nivel('parish', 'Parroquia', 'municipality'),
    ],
    postalCode: postalNumerico(4, 4),
    address: direccion('Ej. Av. Bolívar 50'),
    strictTerritorialValidation: false,
  },
  UY: {
    countryName: 'Uruguay',
    levels: [nivel('department', 'Departamento'), nivel('locality', 'Localidad', 'department')],
    postalCode: postalNumerico(5, 5),
    address: direccion('Ej. Av. 18 de Julio 1000'),
    strictTerritorialValidation: false,
  },
  PY: {
    countryName: 'Paraguay',
    levels: [nivel('department', 'Departamento'), nivel('district', 'Distrito', 'department')],
    postalCode: postalNumerico(4, 4),
    address: direccion('Ej. Av. Mariscal López 500'),
    strictTerritorialValidation: false,
  },
  CR: {
    countryName: 'Costa Rica',
    levels: [
      nivel('province', 'Provincia'),
      nivel('canton', 'Cantón', 'province'),
      nivel('district', 'Distrito', 'canton'),
    ],
    postalCode: postalNumerico(5, 5),
    address: direccion('Ej. Avenida Central 100'),
    strictTerritorialValidation: false,
  },
  PA: {
    countryName: 'Panamá',
    levels: [
      nivel('province', 'Provincia'),
      nivel('district', 'Distrito', 'province'),
      nivel('corregimiento', 'Corregimiento', 'district'),
    ],
    postalCode: { enabled: false, required: false, label: 'Código postal', inputMode: 'numeric' },
    address: direccion('Ej. Calle 50, Edificio Plaza'),
    strictTerritorialValidation: false,
  },
  DO: {
    countryName: 'República Dominicana',
    levels: [nivel('province', 'Provincia'), nivel('municipality', 'Municipio', 'province')],
    postalCode: postalNumerico(5, 5),
    address: direccion('Ej. Calle El Conde 100'),
    strictTerritorialValidation: false,
  },
  GT: {
    countryName: 'Guatemala',
    levels: [nivel('department', 'Departamento'), nivel('municipality', 'Municipio', 'department')],
    postalCode: postalNumerico(5, 5),
    address: direccion('Ej. 6a Avenida 1-00'),
    strictTerritorialValidation: false,
  },
  SV: {
    countryName: 'El Salvador',
    levels: [nivel('department', 'Departamento'), nivel('municipality', 'Municipio', 'department')],
    postalCode: postalNumerico(4, 4),
    address: direccion('Ej. Calle Rubén Darío 100'),
    strictTerritorialValidation: false,
  },
  HN: {
    countryName: 'Honduras',
    levels: [nivel('department', 'Departamento'), nivel('municipality', 'Municipio', 'department')],
    postalCode: postalNumerico(5, 5),
    address: direccion('Ej. Boulevard Morazán 100'),
    strictTerritorialValidation: false,
  },
  NI: {
    countryName: 'Nicaragua',
    levels: [nivel('department', 'Departamento'), nivel('municipality', 'Municipio', 'department')],
    postalCode: postalNumerico(5, 5),
    address: direccion('Ej. Carretera Masaya km 4'),
    strictTerritorialValidation: false,
  },
  ES: {
    countryName: 'España',
    levels: [
      nivel('community', 'Comunidad autónoma'),
      nivel('province', 'Provincia', 'community'),
      nivel('municipality', 'Municipio', 'province'),
    ],
    postalCode: postalNumerico(5, 5),
    address: direccion('Ej. Calle Mayor 10'),
    strictTerritorialValidation: false,
  },
  US: {
    countryName: 'Estados Unidos',
    levels: [
      nivel('state', 'Estado'),
      nivel('county', 'Condado', 'state'),
      nivel('city', 'Ciudad', 'county'),
    ],
    postalCode: {
      enabled: true,
      required: false,
      label: 'ZIP code',
      inputMode: 'numeric',
      minLength: 5,
      maxLength: 10,
      regex: /^[0-9]{5}(-[0-9]{4})?$/,
      placeholder: '90210',
    },
    address: direccion('Ej. 1600 Pennsylvania Ave'),
    strictTerritorialValidation: false,
  },
  CA: {
    countryName: 'Canadá',
    levels: [nivel('province', 'Provincia o territorio'), nivel('city', 'Ciudad o municipio', 'province')],
    postalCode: {
      enabled: true,
      required: false,
      label: 'Código postal',
      inputMode: 'text',
      minLength: 6,
      maxLength: 7,
      regex: /^[A-Za-z][0-9][A-Za-z]\s?[0-9][A-Za-z][0-9]$/,
      placeholder: 'K1A 0B1',
    },
    address: direccion('Ej. 24 Sussex Drive'),
    strictTerritorialValidation: false,
  },
}

// Configuración GENÉRICA segura: 2 niveles de texto controlado (sin listas oficiales).
export const CONFIG_GENERICA: ConfigPaisDireccion = {
  countryName: '',
  levels: [
    { key: 'stateOrRegion', label: 'Estado, región o provincia', placeholder: 'Escribe tu región' },
    { key: 'city', label: 'Ciudad o localidad', placeholder: 'Escribe tu ciudad' },
  ],
  postalCode: postalNumerico(3, 10),
  address: direccion('Escribe tu dirección completa'),
  strictTerritorialValidation: false,
}

// Devuelve la configuración de dirección de un país (o la genérica si no existe).
export function getConfigDireccion(countryCode: string): ConfigPaisDireccion {
  return CONFIG_DIRECCION[countryCode] ?? CONFIG_GENERICA
}
