// Validación de la cédula uruguaya (dígito verificador módulo 10, pesos 2,9,8,7,6,3,4).
// Fuente: algoritmo de la Dirección Nacional de Identificación Civil (Uruguay).
// reviewedAt: 2026-06-19

export function validarCedulaUy(valor: string): boolean {
  const ci = (valor ?? '').replace(/\D/g, '')
  if (ci.length < 7 || ci.length > 8) return false

  // Trabajamos con 8 caracteres: 7 de cuerpo + 1 verificador.
  // Rellenamos con ceros a la izquierda (sin usar parseInt, para conservar los ceros).
  const completo = ci.padStart(8, '0')
  const cuerpo = completo.slice(0, 7)
  const verificador = Number(completo[7])

  const pesos = [2, 9, 8, 7, 6, 3, 4]
  let suma = 0
  for (let i = 0; i < 7; i++) suma += Number(cuerpo[i]) * pesos[i]

  const dv = (10 - (suma % 10)) % 10
  return dv === verificador
}
