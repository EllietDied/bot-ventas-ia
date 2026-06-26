import { describe, it, expect } from 'vitest'
import {
  validarProducto,
  siguienteId,
  crearProductoLocal,
  editarEnLista,
  eliminarEnLista,
} from './ProductosLocal'
import type { DatosProducto } from './ProductosLocal'
import type { Producto } from '../modelos/Producto'

const base: DatosProducto = {
  nombre: 'Mouse Gamer',
  marca: 'Logitech',
  descripcion: 'Mouse con luces RGB',
  categoria: 'Periféricos',
  precio: 89.9,
  stock: 10,
  idVendedor: 'U-002',
  imagen: '🖱️',
}

function lista(): Producto[] {
  return [
    { id: 1, nombre: 'A', descripcion: '', categoria: 'X', precio: 10, stock: 5, estado: 'disponible', imagen: '📦' },
    { id: 2, nombre: 'B', descripcion: '', categoria: 'Y', precio: 20, stock: 0, estado: 'agotado', imagen: '📦' },
  ]
}

describe('ProductosLocal — validación de productos', () => {
  it('acepta un producto válido', () => {
    expect(validarProducto(base)).toBeNull()
  })
  it('rechaza nombre vacío', () => {
    expect(validarProducto({ ...base, nombre: '   ' })).toMatch(/nombre/i)
  })
  it('rechaza categoría vacía', () => {
    expect(validarProducto({ ...base, categoria: '' })).toMatch(/categor/i)
  })
  it('rechaza precio cero o negativo', () => {
    expect(validarProducto({ ...base, precio: 0 })).toMatch(/precio/i)
    expect(validarProducto({ ...base, precio: -5 })).toMatch(/precio/i)
  })
  it('rechaza stock negativo', () => {
    expect(validarProducto({ ...base, stock: -1 })).toMatch(/stock/i)
  })
})

describe('ProductosLocal — crear / editar / eliminar (modo local)', () => {
  it('siguienteId de una lista vacía es 1', () => {
    expect(siguienteId([])).toBe(1)
  })

  it('crea un producto con id incremental y estado según el stock', () => {
    const nuevo = crearProductoLocal(lista(), base)
    expect(nuevo.id).toBe(3) // siguiente al máximo (2)
    expect(nuevo.estado).toBe('disponible')
    expect(nuevo.imagen).toBe('🖱️')
    expect(nuevo.nombre).toBe('Mouse Gamer')
  })

  it('un producto sin stock queda "agotado"', () => {
    const nuevo = crearProductoLocal([], { ...base, stock: 0 })
    expect(nuevo.id).toBe(1)
    expect(nuevo.estado).toBe('agotado')
  })

  it('usa un emoji por defecto si no se envía imagen', () => {
    const nuevo = crearProductoLocal([], { ...base, imagen: undefined })
    expect(nuevo.imagen).toBe('📦')
  })

  it('edita un producto y recalcula el estado al cambiar el stock', () => {
    const editada = editarEnLista(lista(), 1, { precio: 99, stock: 0 })
    const p = editada.find((x) => x.id === 1)!
    expect(p.precio).toBe(99)
    expect(p.estado).toBe('agotado')
  })

  it('no modifica otros productos al editar', () => {
    const editada = editarEnLista(lista(), 1, { precio: 99 })
    expect(editada.find((x) => x.id === 2)!.precio).toBe(20)
  })

  it('elimina un producto de la lista', () => {
    const restantes = eliminarEnLista(lista(), 1)
    expect(restantes).toHaveLength(1)
    expect(restantes[0].id).toBe(2)
  })
})
