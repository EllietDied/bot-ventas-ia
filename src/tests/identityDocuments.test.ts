import { describe, it, expect } from 'vitest'
import { validateIdentityDocument } from '../utils/validateIdentityDocument'
import { normalizeIdentityDocument } from '../utils/normalizeIdentityDocument'

// Atajo para validar y leer solo lo necesario.
function v(countryCode: string, documentCode: string, value: string, extra?: { complement?: string; prefix?: string }) {
  return validateIdentityDocument({ countryCode, documentCode, value, ...extra })
}

describe('Documentos - Perú (DNI)', () => {
  it('acepta 8 números', () => {
    const r = v('PE', 'DNI', '12345678')
    expect(r.isValid).toBe(true)
    expect(r.normalizedValue).toBe('12345678')
  })
  it('rechaza 7 números', () => expect(v('PE', 'DNI', '1234567').isValid).toBe(false))
  it('rechaza 9 números', () => expect(v('PE', 'DNI', '123456789').isValid).toBe(false))
  it('rechaza letras intercaladas', () => expect(v('PE', 'DNI', '1234A678').isValid).toBe(false))
  it('conserva ceros iniciales', () => expect(v('PE', 'DNI', '00123456').normalizedValue).toBe('00123456'))
})

describe('Documentos - Ecuador (cédula con dígito verificador)', () => {
  it('acepta una cédula válida', () => expect(v('EC', 'CEDULA', '1710034065').isValid).toBe(true))
  it('rechaza 9 números', () => expect(v('EC', 'CEDULA', '171003406').isValid).toBe(false))
  it('rechaza 11 números', () => expect(v('EC', 'CEDULA', '17100340651').isValid).toBe(false))
  it('rechaza letras', () => expect(v('EC', 'CEDULA', 'ABCDEFGHIJ').isValid).toBe(false))
  it('rechaza un dígito verificador incorrecto', () =>
    expect(v('EC', 'CEDULA', '1710034060').errorCode).toBe('INVALID_CHECK_DIGIT'))
})

describe('Documentos - Chile (RUN)', () => {
  it('acepta un RUN con dígito numérico (con puntos y guion)', () => {
    const r = v('CL', 'RUN', '12.345.678-5')
    expect(r.isValid).toBe(true)
    expect(r.normalizedValue).toBe('123456785')
  })
  it('acepta un RUN terminado en K', () => expect(v('CL', 'RUN', '12345670K').isValid).toBe(true))
  it('convierte la k minúscula a K', () => {
    const r = v('CL', 'RUN', '12345670k')
    expect(r.normalizedValue).toBe('12345670K')
    expect(r.isValid).toBe(true)
  })
  it('descarta letras distintas de K al normalizar', () =>
    expect(normalizeIdentityDocument('CL', 'RUN', '12345678A')).toBe('12345678'))
  it('rechaza un dígito verificador incorrecto', () =>
    expect(v('CL', 'RUN', '12.345.678-4').errorCode).toBe('INVALID_CHECK_DIGIT'))
})

describe('Documentos - Colombia (cédula antigua y nueva)', () => {
  it('acepta una cédula antigua (6 dígitos)', () => expect(v('CO', 'CC', '123456').isValid).toBe(true))
  it('acepta una cédula nueva (10 dígitos)', () => expect(v('CO', 'CC', '1234567890').isValid).toBe(true))
  it('rechaza solo letras', () => expect(v('CO', 'CC', 'ABCDEFG').isValid).toBe(false))
  it('rechaza más de 10 dígitos', () => expect(v('CO', 'CC', '12345678901').isValid).toBe(false))
})

describe('Documentos - Bolivia (CI + complemento)', () => {
  it('acepta CI sin complemento', () => expect(v('BO', 'CI', '1234567').isValid).toBe(true))
  it('acepta CI con complemento 1A', () =>
    expect(v('BO', 'CI', '1234567', { complement: '1A' }).isValid).toBe(true))
  it('rechaza un complemento demasiado largo', () =>
    expect(v('BO', 'CI', '1234567', { complement: '1A2' }).errorCode).toBe('INVALID_COMPLEMENT'))
})

describe('Documentos - Venezuela (prefijo V/E)', () => {
  it('acepta V + número', () => expect(v('VE', 'CEDULA', '12345678', { prefix: 'V' }).isValid).toBe(true))
  it('acepta E + número', () => expect(v('VE', 'CEDULA', '12345678', { prefix: 'E' }).isValid).toBe(true))
  it('rechaza un prefijo no permitido', () =>
    expect(v('VE', 'CEDULA', '12345678', { prefix: 'J' }).errorCode).toBe('INVALID_PREFIX'))
})

describe('Documentos - Brasil (CPF)', () => {
  it('normaliza un CPF con puntuación', () =>
    expect(v('BR', 'CPF', '111.444.777-35').normalizedValue).toBe('11144477735'))
  it('acepta un CPF sin puntuación', () => expect(v('BR', 'CPF', '11144477735').isValid).toBe(true))
  it('rechaza dígitos verificadores incorrectos', () =>
    expect(v('BR', 'CPF', '11144477700').errorCode).toBe('INVALID_CHECK_DIGIT'))
  it('rechaza números repetidos', () => expect(v('BR', 'CPF', '00000000000').isValid).toBe(false))
})

describe('Documentos - casos límite y seguridad', () => {
  it('rechaza valor vacío como requerido', () => expect(v('PE', 'DNI', '').errorCode).toBe('REQUIRED'))
  it('tolera espacios, puntos y guiones al pegar', () =>
    expect(v('PE', 'DNI', '  1234 5678 ').normalizedValue).toBe('12345678'))
  it('elimina intentos de HTML/script', () =>
    expect(v('PE', 'DNI', '<script>123</script>').normalizedValue).toBe('123'))
  it('rechaza valores demasiado largos', () =>
    expect(v('PE', 'DNI', '1234567890123456789').isValid).toBe(false))
  it('normaliza siempre a string (sin convertir a número, conserva ceros)', () => {
    const r = v('AR', 'DNI', '01234567')
    expect(typeof r.normalizedValue).toBe('string')
    expect(r.normalizedValue).toBe('01234567')
  })
})
