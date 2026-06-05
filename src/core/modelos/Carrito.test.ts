import { describe, it, expect } from 'vitest'
import { Carrito } from './Carrito'
import { Producto } from './Producto'

function producto(id: number, precio: number, stock = 100): Producto {
  return {
    id,
    nombre: 'Producto ' + id,
    descripcion: '',
    categoria: 'Test',
    precio,
    stock,
    estado: 'disponible',
    imagen: '📦',
  }
}

describe('Carrito - cálculos (principios matemáticos)', () => {
  it('un carrito vacío tiene subtotal, descuento y total en 0', () => {
    const c = new Carrito()
    expect(c.calcularSubtotal()).toBe(0)
    expect(c.calcularDescuento()).toBe(0)
    expect(c.calcularTotal()).toBe(0)
  })

  it('subtotal = suma de precio × cantidad', () => {
    const c = new Carrito()
    c.agregarProducto(producto(1, 100))
    c.agregarProducto(producto(1, 100)) // mismo producto: cantidad 2
    c.agregarProducto(producto(2, 50))
    expect(c.calcularSubtotal()).toBe(250) // 100*2 + 50*1
    expect(c.cantidadTotal()).toBe(3)
  })

  it('sin descuento cuando el subtotal es menor a S/ 1000', () => {
    const c = new Carrito()
    c.agregarProducto(producto(1, 500))
    expect(c.calcularDescuento()).toBe(0)
    expect(c.calcularTotal()).toBe(500)
  })

  it('descuento del 5% cuando el subtotal es ≥ S/ 1000', () => {
    const c = new Carrito([{ producto: producto(1, 1000), cantidad: 1 }])
    expect(c.calcularSubtotal()).toBe(1000)
    expect(c.calcularDescuento()).toBe(50) // 5%
    expect(c.calcularTotal()).toBe(950)
  })

  it('descuento del 10% cuando el subtotal es ≥ S/ 3000', () => {
    const c = new Carrito([{ producto: producto(1, 3000), cantidad: 1 }])
    expect(c.calcularDescuento()).toBe(300) // 10%
    expect(c.calcularTotal()).toBe(2700)
  })

  it('no permite agregar más unidades que el stock disponible', () => {
    const c = new Carrito()
    const p = producto(1, 100, 2) // stock = 2
    c.agregarProducto(p)
    c.agregarProducto(p)
    c.agregarProducto(p) // este no debe pasar el tope
    expect(c.cantidadTotal()).toBe(2)
  })

  it('cambiarCantidad respeta el stock máximo', () => {
    const c = new Carrito([{ producto: producto(1, 100, 5), cantidad: 1 }])
    c.cambiarCantidad(1, 10) // pide 10 pero el stock es 5
    expect(c.cantidadTotal()).toBe(5)
  })
})
