// Validación de la cédula ecuatoriana (dígito verificador módulo 10, coeficientes 2,1,2,1...).
// Fuente: algoritmo del Registro Civil del Ecuador (módulo 10).
// reviewedAt: 2026-06-19

export function validarCedulaEc(valor: string): boolean {
  const ci = (valor ?? '').replace(/\D/g, '')
  if (ci.length !== 10) return false

  // Los dos primeros dígitos son la provincia (01-24, y 30 para registrados en el exterior).
  const provincia = Number(ci.slice(0, 2))
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false

  // El tercer dígito debe ser menor que 6 para personas naturales.
  if (Number(ci[2]) >= 6) return false

  let suma = 0
  for (let i = 0; i < 9; i++) {
    // Coeficiente 2 en posiciones pares (0,2,4...), 1 en impares.
    let producto = Number(ci[i]) * (i % 2 === 0 ? 2 : 1)
    if (producto > 9) producto -= 9
    suma += producto
  }
  const verificador = (10 - (suma % 10)) % 10
  return verificador === Number(ci[9])
}
