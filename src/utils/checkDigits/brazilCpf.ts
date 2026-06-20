// Validación del CPF brasileño (dos dígitos verificadores, módulo 11).
// Fuente: algoritmo oficial de la Receita Federal do Brasil.
// reviewedAt: 2026-06-19

export function validarCpf(valor: string): boolean {
  const cpf = (valor ?? '').replace(/\D/g, '')
  if (cpf.length !== 11) return false
  // Rechazamos secuencias de un mismo dígito repetido (00000000000, 11111111111, ...).
  if (/^(\d)\1{10}$/.test(cpf)) return false

  // Calcula un dígito verificador sobre una base, con el peso inicial indicado.
  const calcularDv = (base: string, pesoInicial: number): number => {
    let suma = 0
    for (let i = 0; i < base.length; i++) {
      suma += Number(base[i]) * (pesoInicial - i)
    }
    const resto = suma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const dv1 = calcularDv(cpf.slice(0, 9), 10)
  const dv2 = calcularDv(cpf.slice(0, 10), 11)
  return dv1 === Number(cpf[9]) && dv2 === Number(cpf[10])
}
