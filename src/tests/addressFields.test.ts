import { describe, it, expect } from 'vitest'
import { getConfigDireccion, Ubicacion } from '../config/addressCountryConfig'
import { getOpcionesNivel } from '../data/locations'
import { validarUbicacion, limpiarDireccion } from '../utils/validarUbicacion'

// Construye una ubicación de prueba.
function ubic(parcial: Partial<Ubicacion>): Ubicacion {
  return {
    nivel1: { tipo: '', codigo: '', nombre: '' },
    nivel2: { tipo: '', codigo: '', nombre: '' },
    nivel3: null,
    codigoPostal: '',
    direccion: '',
    ...parcial,
  }
}

describe('Configuración territorial por país (etiquetas correctas)', () => {
  it('Perú usa Departamento → Provincia → Distrito', () => {
    expect(getConfigDireccion('PE').levels.map((l) => l.key)).toEqual([
      'department',
      'province',
      'district',
    ])
  })
  it('Chile usa Región → Provincia → Comuna', () => {
    expect(getConfigDireccion('CL').levels.map((l) => l.label)).toEqual([
      'Región',
      'Provincia',
      'Comuna',
    ])
  })
  it('Colombia usa solo dos niveles (Departamento → Municipio)', () => {
    const niveles = getConfigDireccion('CO').levels
    expect(niveles.map((l) => l.key)).toEqual(['department', 'municipality'])
  })
  it('Ecuador usa Provincia → Cantón → Parroquia', () => {
    expect(getConfigDireccion('EC').levels.map((l) => l.label)).toEqual([
      'Provincia',
      'Cantón',
      'Parroquia',
    ])
  })
  it('un país sin configuración usa la genérica', () => {
    expect(getConfigDireccion('JP').levels.map((l) => l.key)).toEqual(['stateOrRegion', 'city'])
  })
})

describe('Datos territoriales de Perú (reales)', () => {
  it('lista los 25 departamentos', () => {
    const deps = getOpcionesNivel('PE', 'department', '')
    expect(deps.length).toBe(25)
    expect(deps.find((d) => d.name === 'Lambayeque')?.code).toBe('14')
  })
  it('filtra las provincias por departamento', () => {
    const provincias = getOpcionesNivel('PE', 'province', '14')
    expect(provincias.map((p) => p.name)).toEqual(['Chiclayo', 'Ferreñafe', 'Lambayeque'])
  })
  it('filtra los distritos por provincia (Chiclayo)', () => {
    const distritos = getOpcionesNivel('PE', 'district', '1401')
    expect(distritos.length).toBe(20)
    expect(distritos.find((d) => d.code === '140105')?.name).toBe('José Leonardo Ortiz')
  })
  it('otro país no trae listas (usa texto controlado)', () => {
    expect(getOpcionesNivel('CL', 'region', '')).toEqual([])
  })
})

describe('Validación de la ubicación', () => {
  const peruCompleto = ubic({
    nivel1: { tipo: 'department', codigo: '14', nombre: 'Lambayeque' },
    nivel2: { tipo: 'province', codigo: '1401', nombre: 'Chiclayo' },
    nivel3: { tipo: 'district', codigo: '140105', nombre: 'José Leonardo Ortiz' },
    codigoPostal: '14001',
    direccion: 'Av. Chiclayo 245',
  })

  it('acepta una dirección peruana completa', () => {
    expect(validarUbicacion('PE', peruCompleto).ok).toBe(true)
  })
  it('exige el tercer nivel cuando el país lo tiene', () => {
    const sinDistrito = { ...peruCompleto, nivel3: { tipo: '', codigo: '', nombre: '' } }
    const r = validarUbicacion('PE', sinDistrito)
    expect(r.ok).toBe(false)
    expect(r.errores.district).toBeTruthy()
  })
  it('exige la dirección', () => {
    const r = validarUbicacion('PE', { ...peruCompleto, direccion: '' })
    expect(r.errores.direccion).toBeTruthy()
  })
  it('rechaza un código postal con formato inválido', () => {
    const r = validarUbicacion('PE', { ...peruCompleto, codigoPostal: '123' })
    expect(r.errores.codigoPostal).toBeTruthy()
  })
  it('un país de 2 niveles no exige un tercer nivel', () => {
    const colombia = ubic({
      nivel1: { tipo: 'department', codigo: '', nombre: 'Antioquia' },
      nivel2: { tipo: 'municipality', codigo: '', nombre: 'Medellín' },
      direccion: 'Carrera 50 # 20-10',
    })
    expect(validarUbicacion('CO', colombia).ok).toBe(true)
  })
})

describe('Saneamiento de la dirección', () => {
  it('reduce espacios internos repetidos', () => {
    expect(limpiarDireccion('Av.   Lima    245')).toBe('Av. Lima 245')
  })
  it('bloquea etiquetas HTML', () => {
    const limpio = limpiarDireccion('<b>Av. Lima 245</b>')
    expect(limpio.includes('<')).toBe(false)
    expect(limpio.includes('>')).toBe(false)
  })
  it('conserva tildes, números, # y guion', () => {
    expect(limpiarDireccion('Jr. José #12-A')).toBe('Jr. José #12-A')
  })
})
