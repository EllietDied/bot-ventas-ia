import { describe, it, expect } from 'vitest'
import { construirPedidoLocal } from './PedidosLocal'
import type { DatosPedidoLocal } from './PedidosLocal'
import type { Producto } from '../modelos/Producto'

function producto(id: number, precio: number): Producto {
  return {
    id,
    nombre: 'Producto ' + id,
    descripcion: '',
    categoria: 'Periféricos',
    precio,
    stock: 10,
    estado: 'disponible',
    imagen: '📦',
  }
}

const datos: DatosPedidoLocal = {
  correoComprador: 'comprador@demo.com',
  items: [
    { producto: producto(1, 50), cantidad: 2 },
    { producto: producto(2, 100), cantidad: 1 },
  ],
  subtotal: 200,
  descuento: 0,
  total: 200,
  metodoPago: 'tarjeta',
}

const AHORA = 1_700_000_000_000

describe('PedidosLocal — registrar pedido (modo local)', () => {
  it('crea un pedido pendiente con pago simulado aprobado', () => {
    const pedido = construirPedidoLocal(datos, AHORA)
    expect(pedido.estado).toBe('pendiente')
    expect(pedido.total).toBe(200)
    expect(pedido.pago?.estadoPago).toBe('aprobado')
    expect(pedido.idPedido).toBe('PED-' + AHORA)
  })

  it('genera una línea de detalle por cada item, con su subtotal', () => {
    const pedido = construirPedidoLocal(datos, AHORA)
    expect(pedido.detalles).toHaveLength(2)
    expect(pedido.detalles[0]).toMatchObject({
      idProducto: 1,
      cantidad: 2,
      precioUnitario: 50,
      subtotal: 100,
    })
    expect(pedido.detalles[1].subtotal).toBe(100)
  })

  it('conserva el método de pago y el correo del comprador', () => {
    const pedido = construirPedidoLocal(datos, AHORA)
    expect(pedido.pago?.metodoPago).toBe('tarjeta')
    expect(pedido.correoComprador).toBe('comprador@demo.com')
  })
})
