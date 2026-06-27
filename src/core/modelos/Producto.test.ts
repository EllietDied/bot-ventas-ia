import { describe, it, expect } from 'vitest'
import { codigoProducto, type Producto } from './Producto'

// Crea un producto de prueba con lo mínimo (solo importan id y categoría).
function prod(id: number, categoria: string): Producto {
  return {
    id,
    nombre: 'Producto de prueba',
    descripcion: '',
    categoria,
    precio: 1,
    stock: 1,
    estado: 'disponible',
    imagen: '📦',
  }
}

describe('codigoProducto', () => {
  it('usa las 3 primeras letras de la categoría (mayúsculas) y el id con 3 dígitos', () => {
    expect(codigoProducto(prod(1, 'Periféricos'))).toBe('PER-001')
    expect(codigoProducto(prod(14, 'Laptops'))).toBe('LAP-014')
    expect(codigoProducto(prod(3, 'Componentes'))).toBe('COM-003')
  })

  it('quita las tildes antes de tomar el prefijo', () => {
    expect(codigoProducto(prod(5, 'Periféricos'))).toBe('PER-005')
    expect(codigoProducto(prod(8, 'Almacenamiento'))).toBe('ALM-008')
  })

  it('rellena con ceros a la izquierda y admite ids grandes', () => {
    expect(codigoProducto(prod(7, 'Monitores'))).toBe('MON-007')
    expect(codigoProducto(prod(123, 'Laptops'))).toBe('LAP-123')
  })

  it('si la categoría no tiene letras, usa el prefijo GEN', () => {
    expect(codigoProducto(prod(9, '123'))).toBe('GEN-009')
    expect(codigoProducto(prod(4, ''))).toBe('GEN-004')
  })
})
