// Punto de acceso a los datos territoriales.
// Solo Perú tiene listas integradas; para los demás países el formulario usa
// texto controlado (no se inventan divisiones territoriales).
import { Ubigeo, PE_DEPARTAMENTOS, PE_PROVINCIAS, PE_DISTRITOS } from './peru'

export type { Ubigeo }

// Devuelve las opciones de un nivel territorial, filtradas por el código del padre.
// Si no hay datos integrados, devuelve [] y el formulario muestra un campo de texto.
export function getOpcionesNivel(
  countryCode: string,
  levelKey: string,
  parentCode: string,
): Ubigeo[] {
  if (countryCode !== 'PE') return []

  if (levelKey === 'department') return PE_DEPARTAMENTOS
  if (levelKey === 'province') return PE_PROVINCIAS.filter((p) => p.parentCode === parentCode)
  if (levelKey === 'district') return PE_DISTRITOS.filter((d) => d.parentCode === parentCode)
  return []
}
