import { describe, it, expect } from 'vitest'
import { calcularDvRun, validarRun } from '../utils/checkDigits/chileRun'
import { validarCpf } from '../utils/checkDigits/brazilCpf'
import { validarCedulaEc } from '../utils/checkDigits/ecuadorCi'
import { validarCedulaUy } from '../utils/checkDigits/uruguayCi'
import { validarCuit } from '../utils/checkDigits/argentinaCuit'

describe('Dígito verificador - Chile (RUN módulo 11)', () => {
  it('calcula correctamente el dígito verificador', () => {
    expect(calcularDvRun('12345678')).toBe('5')
    expect(calcularDvRun('12345670')).toBe('K')
  })
  it('valida un RUN con dígito numérico', () => {
    expect(validarRun('12345678', '5')).toBe(true)
    expect(validarRun('12345678', '4')).toBe(false)
  })
  it('valida un RUN terminado en K (y acepta k minúscula)', () => {
    expect(validarRun('12345670', 'K')).toBe(true)
    expect(validarRun('12345670', 'k')).toBe(true)
  })
  it('rechaza una letra distinta de K en el verificador', () => {
    expect(validarRun('12345678', 'A')).toBe(false)
  })
})

describe('Dígito verificador - Brasil (CPF)', () => {
  it('acepta un CPF válido', () => {
    expect(validarCpf('11144477735')).toBe(true)
    expect(validarCpf('111.444.777-35')).toBe(true)
  })
  it('rechaza dígitos verificadores incorrectos', () => {
    expect(validarCpf('11144477700')).toBe(false)
  })
  it('rechaza secuencias de un mismo dígito', () => {
    expect(validarCpf('00000000000')).toBe(false)
    expect(validarCpf('11111111111')).toBe(false)
  })
})

describe('Dígito verificador - Ecuador (cédula módulo 10)', () => {
  it('acepta una cédula válida', () => {
    expect(validarCedulaEc('1710034065')).toBe(true)
  })
  it('rechaza un verificador incorrecto', () => {
    expect(validarCedulaEc('1710034060')).toBe(false)
  })
  it('rechaza longitudes distintas de 10', () => {
    expect(validarCedulaEc('171003406')).toBe(false)
    expect(validarCedulaEc('17100340651')).toBe(false)
  })
  it('rechaza una provincia inválida', () => {
    expect(validarCedulaEc('9910034065')).toBe(false)
  })
})

describe('Dígito verificador - Uruguay (cédula)', () => {
  it('acepta una cédula válida (con o sin formato)', () => {
    expect(validarCedulaUy('12345672')).toBe(true)
    expect(validarCedulaUy('1.234.567-2')).toBe(true)
  })
  it('rechaza un verificador incorrecto', () => {
    expect(validarCedulaUy('12345670')).toBe(false)
  })
})

describe('Dígito verificador - Argentina (CUIT módulo 11)', () => {
  it('acepta un CUIT válido (con o sin guiones)', () => {
    expect(validarCuit('20123456786')).toBe(true)
    expect(validarCuit('20-12345678-6')).toBe(true)
  })
  it('rechaza un verificador incorrecto', () => {
    expect(validarCuit('20123456780')).toBe(false)
  })
  it('rechaza longitudes distintas de 11', () => {
    expect(validarCuit('2012345678')).toBe(false)
  })
})
