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
  responderConsulta(mensaje: string, productos: Producto[], nombreCliente?: string): string {
    const texto = mensaje.toLowerCase()
    const nombre = (nombreCliente ?? '').trim()
    const saludo = nombre ? `¡Hola, ${nombre}!` : '¡Hola!'

    if (texto.includes('hola') || texto.includes('buenas') || texto.includes('buenos')) {
      return `${saludo} 👋 Qué bueno verte por IA InkaShop. Cuéntame qué andas buscando —por categoría, para qué lo usarás o tu presupuesto— y te ayudo a encontrar justo lo tuyo.`
    }
    if (texto.includes('gracias')) {
      return nombre
        ? `¡Un gusto ayudarte, ${nombre}! 😊 Aquí ando para lo que necesites.`
        : '¡Un gusto ayudarte! 😊 Aquí ando para lo que necesites.'
    }
    if (texto.includes('precio') || texto.includes('cuesta') || texto.includes('vale')) {
      const p = this.buscarProductoEnTexto(texto, productos)
      if (p) return `El ${p.nombre} está en S/ ${p.precio.toFixed(2)}. ¿Te lo agrego al carrito o prefieres verlo a detalle primero?`
      return 'Dime el nombre del producto y al toque te paso su precio. 🙂'
    }
    if (texto.includes('stock') || texto.includes('disponible') || texto.includes('queda')) {
      const p = this.buscarProductoEnTexto(texto, productos)
      if (p) {
        return p.stock > 0
          ? `¡Sí! Aún nos quedan ${p.stock} unidades de ${p.nombre}, así que vas a tiempo.`
          : `Uy, justo ${p.nombre} se nos agotó. ¿Quieres que te muestre algo parecido?`
      }
      return '¿De qué producto quieres saber si hay stock?'
    }
    if (texto.includes('económic') || texto.includes('economic') || texto.includes('barat')) {
      return '¡Buena! Aquí van las opciones más económicas que tenemos ahora mismo:'
    }
    if (texto.includes('laptop') || texto.includes('portátil') || texto.includes('portatil')) {
      return '¡Genial! Estas son las laptops que mejor te calzarían:'
    }
    if (texto.includes('gamer') || texto.includes('juego')) {
      return 'Si lo tuyo es el rendimiento gamer, mira estas que te van a encantar:'
    }
    if (texto.includes('pc') || texto.includes('armar') || texto.includes('computadora')) {
      return '¡Vamos a armar esa PC! 🔧 Estos componentes son una base sólida para empezar:'
    }
    if (texto.includes('recomi') || texto.includes('busco') || texto.includes('quiero')) {
      return 'Con lo que me cuentas, creo que estas opciones te van muy bien:'
    }
    if (texto.includes('categoria') || texto.includes('categoría') || texto.includes('tipos')) {
      const categorias = [...new Set(productos.map((p) => p.categoria))]
      return `Tenemos varias categorías: ${categorias.join(', ')}. ¿Por cuál arrancamos?`
    }
    if (texto.includes('pago') || texto.includes('pagar') || texto.includes('yape')) {
      return 'Puedes pagar con tarjeta, Yape, Plin o efectivo, con total seguridad. ¿Avanzamos con tu pedido?'
    }

    const encontrado = this.buscarProductoEnTexto(texto, productos)
    if (encontrado) {
      return `${encontrado.nombre}: ${encontrado.descripcion} Está en S/ ${encontrado.precio.toFixed(
        2,
      )} y nos quedan ${encontrado.stock} en stock. ¿Te interesa?`
    }

    return 'Puedo ayudarte por categoría, por uso (gamer, oficina, estudio) o por presupuesto. ¿Qué tienes en mente? 🙂'
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
