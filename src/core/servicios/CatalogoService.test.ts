import { describe, it, expect } from 'vitest'
import { buscarProductos, obtenerCategorias } from './CatalogoService'
import { Producto } from '../modelos/Producto'

const productos: Producto[] = [
  { id: 1, nombre: 'Mouse Gamer', descripcion: '', categoria: 'Periféricos', precio: 90, stock: 5, estado: 'disponible', imagen: '🖱️' },
  { id: 2, nombre: 'Procesador i7', descripcion: '', categoria: 'Componentes', precio: 1200, stock: 3, estado: 'disponible', imagen: '🧠' },
  { id: 3, nombre: 'Teclado', descripcion: '', categoria: 'Periféricos', precio: 150, stock: 8, estado: 'disponible', imagen: '⌨️' },
]

describe('CatalogoService - búsqueda (ConsultarProducto)', () => {
  it('un término vacío devuelve todos los productos', () => {
    expect(buscarProductos('', productos)).toHaveLength(3)
  })
  it('busca por nombre sin importar mayúsculas', () => {
    const r = buscarProductos('mouse', productos)
    expect(r).toHaveLength(1)
    expect(r[0].nombre).toBe('Mouse Gamer')
  })
  it('busca por categoría', () => {
    expect(buscarProductos('periféricos', productos)).toHaveLength(2)
  })
  it('devuelve vacío si no hay coincidencias', () => {
    expect(buscarProductos('xyz', productos)).toHaveLength(0)
  })
  it('obtenerCategorias devuelve las categorías sin repetir', () => {
    expect(obtenerCategorias(productos).sort()).toEqual(['Componentes', 'Periféricos'])
  })
})
