import { normalizeIdentityDocument } from './normalizeIdentityDocument'

// Devuelve una representación VISUAL amigable del documento (con puntos/guiones),
// sin cambiar el valor que se guarda (ese siempre es el normalizado).
export function formatIdentityDocument(
  countryCode: string,
  documentCode: string,
  value: string,
): string {
  const n = normalizeIdentityDocument(countryCode, documentCode, value)
  if (!n) return ''

  // Chile: 12345678K -> 12.345.678-K
  if (countryCode === 'CL' && documentCode === 'RUN' && n.length >= 2) {
    const cuerpo = n.slice(0, -1)
    const dv = n.slice(-1)
    const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${conPuntos}-${dv}`
  }

  // Brasil: 12345678909 -> 123.456.789-09
  if (countryCode === 'BR' && documentCode === 'CPF' && n.length === 11) {
    return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`
  }

  return n
}
