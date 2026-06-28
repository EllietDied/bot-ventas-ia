import { describe, it, expect } from 'vitest'
import {
  aplicarRecarga,
  aplicarCompra,
  BILLETERA_VACIA,
  type EstadoBilletera,
} from './BilleteraLocal'

describe('BilleteraLocal', () => {
  it('una recarga suma al saldo y registra el movimiento', () => {
    const r = aplicarRecarga(BILLETERA_VACIA, 50, 'simulado', 'm1', '2026-06-27')
    expect(r.saldo).toBe(50)
    expect(r.movimientos).toHaveLength(1)
    expect(r.movimientos[0].tipo).toBe('recarga')
    expect(r.movimientos[0].monto).toBe(50)
  })

  it('no muta el estado original (es pura)', () => {
    const inicial: EstadoBilletera = { saldo: 10, movimientos: [] }
    aplicarRecarga(inicial, 5, 'simulado', 'm1', '2026-06-27')
    expect(inicial.saldo).toBe(10) // el original sigue igual
    expect(inicial.movimientos).toHaveLength(0)
  })

  it('redondea a 2 decimales (sin errores de coma flotante)', () => {
    let e = aplicarRecarga(BILLETERA_VACIA, 0.1, 'simulado', 'm1', 'f')
    e = aplicarRecarga(e, 0.2, 'simulado', 'm2', 'f')
    expect(e.saldo).toBe(0.3)
  })

  it('una compra descuenta del saldo', () => {
    const conSaldo: EstadoBilletera = { saldo: 100, movimientos: [] }
    const r = aplicarCompra(conSaldo, 30, 'Compra de prueba', 'm1', 'f')
    expect(r.saldo).toBe(70)
    expect(r.movimientos[0].tipo).toBe('compra')
  })

  it('una compra sin saldo suficiente lanza error', () => {
    const conSaldo: EstadoBilletera = { saldo: 20, movimientos: [] }
    expect(() => aplicarCompra(conSaldo, 50, 'Cara', 'm1', 'f')).toThrow('Saldo insuficiente.')
  })

  it('los movimientos nuevos quedan primero (más reciente arriba)', () => {
    let e = aplicarRecarga(BILLETERA_VACIA, 10, 'simulado', 'm1', 'f1')
    e = aplicarRecarga(e, 20, 'simulado', 'm2', 'f2')
    expect(e.movimientos[0].id).toBe('m2')
    expect(e.movimientos[1].id).toBe('m1')
  })
})
