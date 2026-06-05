import { Pedido } from '../modelos/Pedido'

// ESTRUCTURA DE DATOS: COLA (FIFO - First In, First Out).
// El primer pedido en entrar es el primero en ser atendido.
// Se usa para gestionar los pedidos pendientes.
export class ColaPedidos {
  private elementos: Pedido[] = []

  // Agrega un pedido AL FINAL de la cola.
  encolar(pedido: Pedido): void {
    this.elementos.push(pedido)
  }

  // Retira y devuelve el PRIMER pedido (el más antiguo).
  desencolar(): Pedido | undefined {
    return this.elementos.shift()
  }

  // Muestra el primer pedido sin retirarlo.
  primero(): Pedido | undefined {
    return this.elementos[0]
  }

  estaVacia(): boolean {
    return this.elementos.length === 0
  }

  tamano(): number {
    return this.elementos.length
  }

  // Devuelve una copia de la cola en su orden (del más antiguo al más nuevo).
  listar(): Pedido[] {
    return [...this.elementos]
  }
}
