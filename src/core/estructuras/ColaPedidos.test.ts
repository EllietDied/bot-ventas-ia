import { describe, it, expect } from 'vitest'
import { ColaPedidos } from './ColaPedidos'
import { Pedido } from '../modelos/Pedido'

// Pedido mínimo para las pruebas.
function pedido(id: string): Pedido {
  return {
    idPedido: id,
    correoComprador: 'demo@correo.com',
    fecha: '01/01/2026',
    detalles: [],
    subtotal: 0,
    descuento: 0,
    total: 0,
    estado: 'pendiente',
  }
}

describe('ColaPedidos (FIFO)', () => {
  it('empieza vacía', () => {
    const cola = new ColaPedidos()
    expect(cola.estaVacia()).toBe(true)
    expect(cola.tamano()).toBe(0)
  })

  it('atiende en el orden de llegada (primero en entrar, primero en salir)', () => {
    const cola = new ColaPedidos()
    cola.encolar(pedido('A'))
    cola.encolar(pedido('B'))
    cola.encolar(pedido('C'))
    expect(cola.tamano()).toBe(3)
    expect(cola.desencolar()?.idPedido).toBe('A') // el más antiguo sale primero
    expect(cola.desencolar()?.idPedido).toBe('B')
    expect(cola.desencolar()?.idPedido).toBe('C')
    expect(cola.estaVacia()).toBe(true)
  })

  it('primero() muestra el siguiente sin retirarlo', () => {
    const cola = new ColaPedidos()
    cola.encolar(pedido('A'))
    cola.encolar(pedido('B'))
    expect(cola.primero()?.idPedido).toBe('A')
    expect(cola.tamano()).toBe(2) // no se retiró
  })

  it('desencolar una cola vacía devuelve undefined', () => {
    const cola = new ColaPedidos()
    expect(cola.desencolar()).toBeUndefined()
  })
})
