import { describe, it, expect } from 'vitest'
import { filtrarPorTermino, terminoDeEtiqueta } from '../core/servicios/VisionService'
import { Producto } from '../core/modelos/Producto'

const CATALOGO: Producto[] = [
  { id: 1, nombre: 'Mouse Gamer RGB', categoria: 'Periféricos', marca: 'Logitech', descripcion: '', precio: 90, stock: 10, estado: 'disponible', imagen: '🖱️' },
  { id: 2, nombre: 'Teclado Mecánico', categoria: 'Periféricos', marca: 'Redragon', descripcion: '', precio: 200, stock: 5, estado: 'disponible', imagen: '⌨️' },
  { id: 3, nombre: 'Laptop Económica', categoria: 'Laptops', marca: 'Asus', descripcion: '', precio: 1450, stock: 3, estado: 'disponible', imagen: '💻' },
  { id: 4, nombre: 'Mouse Office', categoria: 'Periféricos', marca: 'HP', descripcion: '', precio: 40, stock: 0, estado: 'agotado', imagen: '🖱️' },
]

describe('Búsqueda visual', () => {
  it('mapea etiquetas de ImageNet a términos del catálogo', () => {
    expect(terminoDeEtiqueta('mouse, computer mouse')).toBe('mouse')
    expect(terminoDeEtiqueta('computer keyboard')).toBe('teclado')
    expect(terminoDeEtiqueta('laptop, laptop computer')).toBe('laptop')
    expect(terminoDeEtiqueta('monitor')).toBe('monitor')
  })
  it('devuelve vacío para etiquetas no relacionadas', () => {
    expect(terminoDeEtiqueta('banana')).toBe('')
    expect(terminoDeEtiqueta('golden retriever')).toBe('')
  })
  it('filtra el catálogo por término (solo productos disponibles)', () => {
    expect(filtrarPorTermino('mouse', CATALOGO).map((p) => p.id)).toEqual([1]) // el id 4 está agotado
    expect(filtrarPorTermino('teclado', CATALOGO).map((p) => p.id)).toEqual([2])
  })
  it('encuentra distintas marcas del mismo tipo de producto', () => {
    const conDosMarcas: Producto[] = [
      ...CATALOGO,
      { id: 5, nombre: 'Mouse Inalámbrico', categoria: 'Periféricos', marca: 'Razer', descripcion: '', precio: 120, stock: 8, estado: 'disponible', imagen: '🖱️' },
    ]
    const r = filtrarPorTermino('mouse', conDosMarcas)
    expect(r.map((p) => p.marca)).toEqual(['Logitech', 'Razer'])
  })
  it('un término vacío no devuelve productos', () => {
    expect(filtrarPorTermino('', CATALOGO)).toEqual([])
  })
})
