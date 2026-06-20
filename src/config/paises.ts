// Lista de países para el selector telefónico del registro.
// El país elegido aquí es la ÚNICA fuente de verdad (countryCode ISO 3166-1 alpha-2):
// de él dependen el documento de identidad y (en la Fase 2) los campos de dirección.
//
// Importante: no se deduce el país solo por el prefijo telefónico, porque varios
// países comparten el mismo prefijo (ej. +1 → Estados Unidos, Canadá). Por eso
// cada país conserva su propio código ISO.

export interface Pais {
  countryCode: string // ISO 3166-1 alpha-2 (PE, CL, US...)
  countryName: string
  callingCode: string // prefijo telefónico internacional (+51, +56...)
  flag: string // bandera (emoji)
}

// Orden: Perú primero (país principal del proyecto) y luego el resto alfabéticamente.
export const PAISES: Pais[] = [
  { countryCode: 'PE', countryName: 'Perú', callingCode: '+51', flag: '🇵🇪' },
  { countryCode: 'AR', countryName: 'Argentina', callingCode: '+54', flag: '🇦🇷' },
  { countryCode: 'BO', countryName: 'Bolivia', callingCode: '+591', flag: '🇧🇴' },
  { countryCode: 'BR', countryName: 'Brasil', callingCode: '+55', flag: '🇧🇷' },
  { countryCode: 'CA', countryName: 'Canadá', callingCode: '+1', flag: '🇨🇦' },
  { countryCode: 'CL', countryName: 'Chile', callingCode: '+56', flag: '🇨🇱' },
  { countryCode: 'CO', countryName: 'Colombia', callingCode: '+57', flag: '🇨🇴' },
  { countryCode: 'CR', countryName: 'Costa Rica', callingCode: '+506', flag: '🇨🇷' },
  { countryCode: 'EC', countryName: 'Ecuador', callingCode: '+593', flag: '🇪🇨' },
  { countryCode: 'SV', countryName: 'El Salvador', callingCode: '+503', flag: '🇸🇻' },
  { countryCode: 'ES', countryName: 'España', callingCode: '+34', flag: '🇪🇸' },
  { countryCode: 'US', countryName: 'Estados Unidos', callingCode: '+1', flag: '🇺🇸' },
  { countryCode: 'GT', countryName: 'Guatemala', callingCode: '+502', flag: '🇬🇹' },
  { countryCode: 'HN', countryName: 'Honduras', callingCode: '+504', flag: '🇭🇳' },
  { countryCode: 'MX', countryName: 'México', callingCode: '+52', flag: '🇲🇽' },
  { countryCode: 'NI', countryName: 'Nicaragua', callingCode: '+505', flag: '🇳🇮' },
  { countryCode: 'PA', countryName: 'Panamá', callingCode: '+507', flag: '🇵🇦' },
  { countryCode: 'PY', countryName: 'Paraguay', callingCode: '+595', flag: '🇵🇾' },
  { countryCode: 'DO', countryName: 'República Dominicana', callingCode: '+1', flag: '🇩🇴' },
  { countryCode: 'UY', countryName: 'Uruguay', callingCode: '+598', flag: '🇺🇾' },
  { countryCode: 'VE', countryName: 'Venezuela', callingCode: '+58', flag: '🇻🇪' },
]

// Busca un país por su código ISO.
export function getPais(countryCode: string): Pais | undefined {
  return PAISES.find((p) => p.countryCode === countryCode)
}
