import { Producto } from './Producto'

// CLASE ChatBotIA: es el asistente de ventas del sistema.
// NO usa una IA real: responde con reglas simples y recomienda
// productos combinando varias señales (texto, categoría, presupuesto,
// historial y disponibilidad). Es el componente central de la aplicación.
export class ChatBotIA {
  idBot: string
  modeloIA: string

  constructor() {
    this.idBot = 'BOT-001'
    this.modeloIA = 'Asistente InkaShop v2'
  }

  // Genera la respuesta en texto del asistente según el mensaje del usuario.
  responderConsulta(mensaje: string, productos: Producto[]): string {
    const texto = mensaje.toLowerCase()

    if (texto.includes('hola') || texto.includes('buenas') || texto.includes('buenos')) {
      return '¡Hola! Soy tu asistente de ventas. Cuéntame qué buscas (por categoría, uso o presupuesto) y te recomiendo las mejores opciones.'
    }
    if (texto.includes('gracias')) {
      return '¡Con gusto! Estoy aquí para acompañarte en tu compra.'
    }
    if (texto.includes('precio') || texto.includes('cuesta') || texto.includes('vale')) {
      const p = this.buscarProductoEnTexto(texto, productos)
      if (p) return `El ${p.nombre} cuesta S/ ${p.precio.toFixed(2)}. ¿Quieres que lo agregue a tu carrito?`
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
    if (texto.includes('económic') || texto.includes('economic') || texto.includes('barat')) {
      return 'Te muestro las opciones más económicas disponibles:'
    }
    if (texto.includes('laptop') || texto.includes('portátil') || texto.includes('portatil')) {
      return 'Estas son las laptops que te puedo recomendar:'
    }
    if (texto.includes('gamer') || texto.includes('juego')) {
      return 'Si buscas rendimiento gamer, te recomiendo estos productos:'
    }
    if (texto.includes('pc') || texto.includes('armar') || texto.includes('computadora')) {
      return 'Para armar tu PC, estos componentes son una buena base:'
    }
    if (texto.includes('recomi') || texto.includes('busco') || texto.includes('quiero')) {
      return 'Según lo que me cuentas, te recomiendo estas opciones:'
    }
    if (texto.includes('categoria') || texto.includes('categoría') || texto.includes('tipos')) {
      const categorias = [...new Set(productos.map((p) => p.categoria))]
      return `Tenemos estas categorías: ${categorias.join(', ')}. ¿Cuál te interesa?`
    }
    if (texto.includes('pago') || texto.includes('pagar') || texto.includes('yape')) {
      return 'Aceptamos tarjeta, Yape, Plin y efectivo. Pago 100% seguro y protegido.'
    }

    const encontrado = this.buscarProductoEnTexto(texto, productos)
    if (encontrado) {
      return `${encontrado.nombre}: ${encontrado.descripcion} Precio: S/ ${encontrado.precio.toFixed(
        2,
      )} (stock: ${encontrado.stock}).`
    }

    return 'Puedo recomendarte productos por categoría, uso (gamer, oficina) o presupuesto. ¿Qué necesitas?'
  }

  // Recomendación por categorías consultadas (se usa en "Explorar catálogo").
  recomendarProducto(categoriasConsultadas: string[], productos: Producto[]): Producto[] {
    if (categoriasConsultadas.length === 0) {
      return productos.filter((p) => p.stock > 0).slice(0, 4)
    }
    const frecuencia: Record<string, number> = {}
    for (const categoria of categoriasConsultadas) {
      frecuencia[categoria] = (frecuencia[categoria] || 0) + 1
    }
    const categoriaTop = Object.keys(frecuencia).sort((a, b) => frecuencia[b] - frecuencia[a])[0]
    return productos.filter((p) => p.categoria === categoriaTop && p.stock > 0).slice(0, 4)
  }

  // Recomendación inteligente del asistente. Combina, en orden:
  // 1) uso (gamer), 2) categoría/laptop/PC, 3) presupuesto,
  // 4) historial de consultas y 5) productos disponibles (populares).
  recomendarPorConsulta(
    mensaje: string,
    productos: Producto[],
    categoriasConsultadas: string[],
  ): Producto[] {
    const texto = mensaje.toLowerCase()
    let candidatos = productos.filter((p) => p.stock > 0)
    let filtrado = false

    // 1) Uso gamer
    if (texto.includes('gamer') || texto.includes('juego')) {
      const r = candidatos.filter((p) => p.nombre.toLowerCase().includes('gamer'))
      if (r.length > 0) {
        candidatos = r
        filtrado = true
      }
    }

    // 2) Categoría mencionada, laptop o componentes (armar PC)
    const categorias = [...new Set(productos.map((p) => p.categoria.toLowerCase()))]
    const catMencionada = categorias.find((c) => texto.includes(c))
    if (catMencionada) {
      candidatos = candidatos.filter((p) => p.categoria.toLowerCase() === catMencionada)
      filtrado = true
    } else if (texto.includes('laptop') || texto.includes('portátil') || texto.includes('portatil')) {
      const r = candidatos.filter((p) => p.categoria.toLowerCase().includes('laptop'))
      if (r.length > 0) {
        candidatos = r
        filtrado = true
      }
    } else if (texto.includes('pc') || texto.includes('computadora') || texto.includes('armar')) {
      const r = candidatos.filter((p) => p.categoria.toLowerCase() === 'componentes')
      if (r.length > 0) {
        candidatos = r
        filtrado = true
      }
    }

    // 3) Presupuesto mencionado
    const presupuesto = this.extraerPresupuesto(texto)
    if (presupuesto !== null) {
      candidatos = candidatos.filter((p) => p.precio <= presupuesto)
      filtrado = true
    }
    if (texto.includes('económic') || texto.includes('economic') || texto.includes('barat')) {
      candidatos = [...candidatos].sort((a, b) => a.precio - b.precio)
      filtrado = true
    }

    // 4) Historial de consultas (si el texto no aportó filtros)
    if (!filtrado && categoriasConsultadas.length > 0) {
      const frecuencia: Record<string, number> = {}
      for (const c of categoriasConsultadas) frecuencia[c] = (frecuencia[c] || 0) + 1
      const top = Object.keys(frecuencia).sort((a, b) => frecuencia[b] - frecuencia[a])[0]
      const r = candidatos.filter((p) => p.categoria === top)
      if (r.length > 0) candidatos = r
    }

    // 5) Devolvemos hasta 4 (disponibles / populares por defecto)
    return candidatos.slice(0, 4)
  }

  // Detecta un presupuesto en el texto, solo si hay una pista de precio
  // (ej. "menos de 1000", "hasta 2000 soles").
  extraerPresupuesto(texto: string): number | null {
    const pista = /menos de|hasta|máximo|maximo|presupuesto|soles|s\/|por debajo/.test(texto)
    if (!pista) return null
    const m = texto.match(/(\d{2,6})/)
    return m ? Number(m[1]) : null
  }

  // Busca, dentro del texto, el primer producto cuyo nombre aparezca.
  private buscarProductoEnTexto(texto: string, productos: Producto[]): Producto | undefined {
    return productos.find((p) => texto.includes(p.nombre.toLowerCase()))
  }
}
