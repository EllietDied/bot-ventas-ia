// Una consulta reciente realizada por el usuario (búsqueda o mensaje al bot).
export interface Consulta {
  termino: string
  categoria: string
  fechaHora: string
}

// ESTRUCTURA DE DATOS: PILA (LIFO - Last In, First Out).
// La última consulta en entrar es la primera en mostrarse.
// Se usa para el historial de consultas recientes.
export class PilaConsultas {
  private elementos: Consulta[] = []

  // Agrega una consulta EN LA CIMA de la pila.
  apilar(consulta: Consulta): void {
    this.elementos.push(consulta)
  }

  // Retira y devuelve la consulta MÁS RECIENTE.
  desapilar(): Consulta | undefined {
    return this.elementos.pop()
  }

  // Devuelve la consulta más reciente sin retirarla.
  cima(): Consulta | undefined {
    return this.elementos[this.elementos.length - 1]
  }

  estaVacia(): boolean {
    return this.elementos.length === 0
  }

  tamano(): number {
    return this.elementos.length
  }

  // Lista las consultas en orden LIFO (de la más reciente a la más antigua).
  listar(): Consulta[] {
    return [...this.elementos].reverse()
  }
}
