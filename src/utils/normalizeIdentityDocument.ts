import { getDocumento } from '../config/identityDocuments'

// Normaliza el documento según país y tipo. Reglas generales:
//  - recorta espacios al inicio y al final,
//  - pasa letras a mayúsculas,
//  - quita puntos y guiones cuando son solo formato visual,
//  - conserva las letras que sí forman parte del documento (Chile K, CURP...),
//  - conserva los ceros iniciales,
//  - NUNCA convierte el documento a Number y siempre devuelve un string.
export function normalizeIdentityDocument(
  countryCode: string,
  documentCode: string,
  value: string,
): string {
  const base = (value ?? '').trim()
  const config = getDocumento(countryCode, documentCode)
  // Cada documento trae su propia función de normalización en la configuración.
  return config.normalize(base)
}
