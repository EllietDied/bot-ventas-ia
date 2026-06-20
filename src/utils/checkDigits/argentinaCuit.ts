// Validación del CUIT / CUIL argentino (11 dígitos, módulo 11, pesos 5,4,3,2,7,6,5,4,3,2).
// Fuente: algoritmo de la AFIP (Administración Federal de Ingresos Públicos).
// reviewedAt: 2026-06-19

export function validarCuit(valor: string): boolean {
  const cuit = (valor ?? '').replace(/\D/g, '')
  if (cuit.length !== 11) return false

  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let suma = 0
  for (let i = 0; i < 10; i++) suma += Number(cuit[i]) * pesos[i]

  let dv = 11 - (suma % 11)
  if (dv === 11) dv = 0
  if (dv === 10) dv = 9
  return dv === Number(cuit[10])
}
