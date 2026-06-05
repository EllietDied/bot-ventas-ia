import { describe, it, expect } from 'vitest'
import { ChatBotIA } from './ChatBotIA'
import { Producto } from './Producto'

const productos: Producto[] = [
  { id: 1, nombre: 'Mouse Gamer', descripcion: 'Mouse RGB', categoria: 'Periféricos', precio: 90, stock: 5, estado: 'disponible', imagen: '🖱️' },
  { id: 2, nombre: 'Procesador i7', descripcion: 'CPU', categoria: 'Componentes', precio: 1200, stock: 3, estado: 'disponible', imagen: '🧠' },
  { id: 3, nombre: 'Teclado', descripcion: 'Mecánico', categoria: 'Periféricos', precio: 150, stock: 0, estado: 'agotado', imagen: '⌨️' },
]

const bot = new ChatBotIA()

describe('ChatBotIA - respuestas simuladas', () => {
  it('saluda al recibir un saludo', () => {
    expect(bot.responderConsulta('hola', productos).toLowerCase()).toContain('hola')
  })
  it('responde el precio de un producto mencionado', () => {
    const r = bot.responderConsulta('precio del Mouse Gamer', productos)
    expect(r).toContain('90')
  })
})

describe('ChatBotIA - recomendación por categorías consultadas', () => {
  it('sin historial recomienda productos disponibles', () => {
    const r = bot.recomendarProducto([], productos)
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((p) => p.stock > 0)).toBe(true)
  })
  it('recomienda según la categoría más consultada', () => {
    const r = bot.recomendarProducto(['Componentes', 'Componentes', 'Periféricos'], productos)
    expect(r.every((p) => p.categoria === 'Componentes')).toBe(true)
  })
})
