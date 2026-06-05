import { describe, it, expect } from 'vitest'
import { PilaConsultas, Consulta } from './PilaConsultas'

function consulta(termino: string): Consulta {
  return { termino, categoria: 'Periféricos', fechaHora: '01/01/2026' }
}

describe('PilaConsultas (LIFO)', () => {
  it('empieza vacía', () => {
    const pila = new PilaConsultas()
    expect(pila.estaVacia()).toBe(true)
  })

  it('recupera primero la última consulta (último en entrar, primero en salir)', () => {
    const pila = new PilaConsultas()
    pila.apilar(consulta('mouse'))
    pila.apilar(consulta('teclado'))
    pila.apilar(consulta('monitor'))
    expect(pila.desapilar()?.termino).toBe('monitor') // la más reciente
    expect(pila.desapilar()?.termino).toBe('teclado')
    expect(pila.desapilar()?.termino).toBe('mouse')
  })

  it('cima() muestra la más reciente sin retirarla', () => {
    const pila = new PilaConsultas()
    pila.apilar(consulta('mouse'))
    pila.apilar(consulta('teclado'))
    expect(pila.cima()?.termino).toBe('teclado')
    expect(pila.tamano()).toBe(2)
  })

  it('listar() devuelve de la más reciente a la más antigua', () => {
    const pila = new PilaConsultas()
    pila.apilar(consulta('a'))
    pila.apilar(consulta('b'))
    const lista = pila.listar()
    expect(lista[0].termino).toBe('b')
    expect(lista[1].termino).toBe('a')
  })
})
