import { describe, it, expect } from 'vitest'
import {
  quiereCancelar,
  operacionMencionada,
  esIntencionDeCambio,
  pareceDuda,
} from './IntencionVendedor'

describe('IntencionVendedor', () => {
  describe('quiereCancelar', () => {
    it('detecta frases de cancelación', () => {
      expect(quiereCancelar('cancelar')).toBe(true)
      expect(quiereCancelar('mejor cancela esto')).toBe(true)
      expect(quiereCancelar('ya no quiero')).toBe(true)
      expect(quiereCancelar('olvídalo')).toBe(true)
      expect(quiereCancelar('me arrepentí')).toBe(true)
    })
    it('no confunde un nombre de producto con cancelar', () => {
      expect(quiereCancelar('Mouse Gamer RGB')).toBe(false)
      expect(quiereCancelar('Teclado mecánico azul')).toBe(false)
    })
  })

  describe('operacionMencionada', () => {
    it('reconoce cada operación', () => {
      expect(operacionMencionada('quiero modificar')).toBe('modificar')
      expect(operacionMencionada('mejor elimino ese')).toBe('eliminar')
      expect(operacionMencionada('agregar otro producto')).toBe('agregar')
      expect(operacionMencionada('ver mis productos')).toBe('ver')
    })
    it('no marca operación en un nombre normal', () => {
      expect(operacionMencionada('Mouse Logitech')).toBe(null)
      expect(operacionMencionada('Editor de video Pro')).toBe(null) // "editor" != "editar"
    })
  })

  describe('esIntencionDeCambio', () => {
    it('detecta señales de querer cambiar', () => {
      expect(esIntencionDeCambio('no, quiero modificar')).toBe(true)
      expect(esIntencionDeCambio('mejor elimino')).toBe(true)
    })
    it('un dato normal no es intención de cambio', () => {
      expect(esIntencionDeCambio('Cable HDMI de 2 metros')).toBe(false)
    })
  })

  describe('pareceDuda', () => {
    it('detecta dudas y arrepentimientos', () => {
      expect(pareceDuda('me equivoqué')).toBe(true)
      expect(pareceDuda('no sé qué poner aquí')).toBe(true)
      expect(pareceDuda('espera...')).toBe(true)
    })
    it('un dato normal no parece duda', () => {
      expect(pareceDuda('Audífonos HyperX')).toBe(false)
    })
  })

  describe('caso de la foto: "no, me equivoqué, quiero modificar"', () => {
    const frase = 'no, me equivoqué, quiero modificar'
    it('se interpreta como CAMBIO de operación (no como dato/nombre)', () => {
      // No es solo cancelar...
      expect(quiereCancelar(frase)).toBe(false)
      // ...sino un cambio claro: menciona "modificar" con intención de cambio.
      expect(operacionMencionada(frase)).toBe('modificar')
      expect(esIntencionDeCambio(frase)).toBe(true)
    })
  })
})
