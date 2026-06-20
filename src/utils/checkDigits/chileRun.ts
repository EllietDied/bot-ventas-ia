// Dígito verificador del RUN / RUT chileno (algoritmo módulo 11).
// Fuente: algoritmo oficial de módulo 11 (Servicio de Registro Civil e Identificación de Chile).
// reviewedAt: 2026-06-19

// Calcula el dígito verificador del cuerpo numérico (puede ser un número o la letra K).
export function calcularDvRun(cuerpo: string): string {
  let suma = 0
  let multiplo = 2
  // Recorremos el cuerpo de derecha a izquierda con la serie 2,3,4,5,6,7 (que se repite).
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

// Valida que cuerpo + dígito verificador formen un RUN correcto.
export function validarRun(cuerpo: string, verificador: string): boolean {
  if (!/^[0-9]+$/.test(cuerpo)) return false
  const dv = (verificador ?? '').toUpperCase()
  if (!/^[0-9K]$/.test(dv)) return false
  return calcularDvRun(cuerpo) === dv
}
