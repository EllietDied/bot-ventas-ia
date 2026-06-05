import { Producto } from './Producto'

// CLASE ChatBotIA: simula la inteligencia artificial del bot.
// NO se conecta a una API real: responde con reglas simples
// basadas en palabras clave del mensaje del usuario.
export class ChatBotIA {
  idBot: string
  modeloIA: string

  constructor() {
    this.idBot = 'BOT-001'
    this.modeloIA = 'Simulado v1'
  }

  // Genera una respuesta automática según el texto del usuario.
  responderConsulta(mensaje: string, productos: Producto[]): string {
    const texto = mensaje.toLowerCase()

    if (texto.includes('hola') || texto.includes('buenas') || texto.includes('buenos')) {
      return '¡Hola! Soy tu asistente de ventas. Pregúntame por precios, stock o categorías de productos.'
    }
    if (texto.includes('precio') || texto.includes('cuesta') || texto.includes('vale')) {
      const p = this.buscarProductoEnTexto(texto, productos)
      if (p) return `El ${p.nombre} cuesta S/ ${p.precio.toFixed(2)}.`
      return 'Dime el nombre del producto y te indico su precio.'
    }
    if (texto.includes('stock') || texto.includes('disponible') || texto.includes('queda')) {
      const p = this.buscarProductoEnTexto(texto, productos)
      if (p) {
        return p.stock > 0
          ? `Sí, tenemos ${p.stock} unidades de ${p.nombre}.`
          : `Lo siento, ${p.nombre} está agotado.`
      }
      return '¿De qué producto quieres saber el stock?'
    }
    if (texto.includes('categoria') || texto.includes('categoría') || texto.includes('tipos')) {
      const categorias = [...new Set(productos.map((p) => p.categoria))]
      return `Tenemos estas categorías: ${categorias.join(', ')}.`
    }
    if (texto.includes('pago') || texto.includes('pagar') || texto.includes('yape')) {
      return 'Aceptamos tarjeta, Yape, Plin y efectivo (pago simulado en esta demo).'
    }
    if (texto.includes('gracias')) {
      return '¡Con gusto! ¿Deseas que te recomiende algún producto?'
    }

    // Si el mensaje menciona un producto concreto, damos su información.
    const encontrado = this.buscarProductoEnTexto(texto, productos)
    if (encontrado) {
      return `${encontrado.nombre}: ${encontrado.descripcion} Precio: S/ ${encontrado.precio.toFixed(
        2,
      )} (stock: ${encontrado.stock}).`
    }

    return 'No entendí tu consulta. Puedes preguntarme por un producto, su precio o su stock.'
  }

  // Recomienda productos según las categorías que el usuario ha consultado.
  // Si no hay historial, recomienda productos disponibles por defecto.
  recomendarProducto(categoriasConsultadas: string[], productos: Producto[]): Producto[] {
    if (categoriasConsultadas.length === 0) {
      return productos.filter((p) => p.stock > 0).slice(0, 3)
    }

    // Contamos cuántas veces se consultó cada categoría.
    const frecuencia: Record<string, number> = {}
    for (const categoria of categoriasConsultadas) {
      frecuencia[categoria] = (frecuencia[categoria] || 0) + 1
    }

    // Elegimos la categoría más consultada.
    const categoriaTop = Object.keys(frecuencia).sort((a, b) => frecuencia[b] - frecuencia[a])[0]

    return productos.filter((p) => p.categoria === categoriaTop && p.stock > 0).slice(0, 3)
  }

  // Busca, dentro del texto, el primer producto cuyo nombre aparezca.
  private buscarProductoEnTexto(texto: string, productos: Producto[]): Producto | undefined {
    return productos.find((p) => texto.includes(p.nombre.toLowerCase()))
  }
}
