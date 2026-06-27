// AsistenteIAService.ts
// Servicio del frontend para el asistente. Decide qué modo usar:
//   - Modo IA real: llama a la función segura /api/chat (usa Claude en el servidor).
//   - Modo simulado: usa la clase académica ChatBotIA (reglas, sin conexión).
// La clave de Claude NUNCA está aquí; lo único público es el interruptor
// VITE_USAR_IA_REAL (true/false). Si la IA real falla, se usa el modo simulado.

import { ChatBotIA } from '../modelos/ChatBotIA'
import { Producto } from '../modelos/Producto'

// Acciones que el asistente puede sugerir (las ejecuta la app, no el modelo).
export type AccionSugerida =
  | 'VER_PRODUCTO'
  | 'AGREGAR_CARRITO'
  | 'COMPARAR'
  | 'CONSULTAR_VENDEDOR'
  | 'NINGUNA'

// Rol de quien usa el asistente: el comprador (ventas) o el vendedor (gestión).
export type RolAsistente = 'comprador' | 'vendedor'

// Un mensaje del historial que se envía como contexto a la IA.
export interface MensajeHistorial {
  rol: 'usuario' | 'bot'
  texto: string
}

// Lo que el asistente necesita para responder (vale para IA real y modo simulado).
export interface ContextoAsistente {
  productos: Producto[]
  categoriasConsultadas: string[]
  nombreCliente?: string // primer nombre del cliente, para saludarlo por su nombre
  carrito: { nombre: string; cantidad: number; precio: number }[]
  totalCarrito: number
  historial: MensajeHistorial[]
}

// Respuesta estructurada del asistente.
export interface RespuestaAsistenteIA {
  mensaje: string
  productosRecomendados: string[] // ids de productos del catálogo
  accionSugerida: AccionSugerida
}

// Resultado final que consume la pantalla del chat.
export interface ResultadoAsistente extends RespuestaAsistenteIA {
  fuente: 'ia' | 'local' // de dónde salió la respuesta
  falloIA?: boolean // true si se intentó la IA real y se cayó al modo local
}

const MAX_MENSAJE = 1000
const MAX_HISTORIAL = 10
// ms de espera máxima a la API antes de usar el respaldo. Es alto porque el modelo
// v4-pro "piensa" antes de responder y puede tardar bastante; debe ser algo menor
// que el maxDuration de la función en vercel.json (60s) para darle tiempo a responder.
const TIEMPO_LIMITE = 55000

// Chatbot simulado (académico): modo sin conexión y respaldo de la IA real.
const bot = new ChatBotIA()

// ¿Está activado el modo IA real? Se lee en cada llamada (así es testeable).
export function usarIAReal(): boolean {
  return import.meta.env.VITE_USAR_IA_REAL === 'true'
}

// Evita enviar dos veces el MISMO mensaje (doble clic) y solicitudes en paralelo.
let solicitudEnCurso = false
let ultimoEnviado = ''

// Detecta un presupuesto en el texto (reutiliza la lógica del chatbot).
function detectarPresupuesto(mensaje: string): number | null {
  return bot.extraerPresupuesto(mensaje.toLowerCase())
}

// Detecta una categoría mencionada en el texto.
function detectarCategoria(mensaje: string, productos: Producto[]): string {
  const t = mensaje.toLowerCase()
  const categorias = [...new Set(productos.map((p) => p.categoria))]
  return categorias.find((c) => t.includes(c.toLowerCase())) ?? ''
}

// Elige los productos relevantes a enviar a la IA (no mandamos todo el catálogo).
// Filtra por stock>0, categoría, presupuesto y coincidencia con el texto.
function filtrarRelevantes(
  mensaje: string,
  productos: Producto[],
  presupuesto: number | null,
  categoria: string,
): Producto[] {
  let lista = productos.filter((p) => p.stock > 0)
  if (categoria) lista = lista.filter((p) => p.categoria === categoria)
  if (presupuesto) lista = lista.filter((p) => p.precio <= presupuesto)

  // Coincidencia por las palabras del usuario con el nombre, marca o categoría.
  // Usa la MISMA búsqueda flexible del chatbot, que tolera escritura parcial
  // ("lapto" encuentra "Laptops"), plurales y tildes. Así la IA real siempre
  // recibe los productos relevantes (antes "lapto" no detectaba nada y las
  // laptops quedaban fuera de los primeros 12 que se enviaban).
  const porTexto = bot.buscarPorPalabras(mensaje, lista)
  const elegidos = porTexto.length > 0 ? porTexto : lista
  // Respaldo: si quedó vacío, mandamos productos disponibles.
  const base = elegidos.length > 0 ? elegidos : productos.filter((p) => p.stock > 0)
  return base.slice(0, 12)
}

// Convierte una lista de ids en productos reales, descartando ids inventados.
export function resolverProductos(ids: string[], productos: Producto[]): Producto[] {
  return ids
    .map((id) => productos.find((p) => String(p.id) === id))
    .filter((p): p is Producto => p !== undefined)
}

// Respuesta del MODO SIMULADO (sin conexión): respaldo cuando no hay IA real.
function respuestaLocal(
  mensaje: string,
  ctx: ContextoAsistente,
  rol: RolAsistente = 'comprador',
): ResultadoAsistente {
  // Al vendedor no le recomendamos productos: le damos una respuesta cálida que lo
  // orienta a las opciones de gestión (es el respaldo si la IA real no responde).
  if (rol === 'vendedor') {
    const nombre = ctx.nombreCliente ? ', ' + ctx.nombreCliente : ''
    return {
      mensaje: `¡Aquí estoy${nombre}! 😊 Puedo ayudarte a agregar, modificar o eliminar un producto, o mostrarte los que ya tienes publicados. ¿Con cuál seguimos?`,
      productosRecomendados: [],
      accionSugerida: 'NINGUNA',
      fuente: 'local',
    }
  }
  const texto = bot.responderConsulta(mensaje, ctx.productos, ctx.nombreCliente)
  const recomendados = mensaje.toLowerCase().includes('gracias')
    ? []
    : bot.recomendarPorConsulta(mensaje, ctx.productos, ctx.categoriasConsultadas)
  return {
    mensaje: texto,
    productosRecomendados: recomendados.map((p) => String(p.id)),
    accionSugerida: 'NINGUNA',
    fuente: 'local',
  }
}

// Llama a la función serverless /api/chat (MODO IA REAL).
async function consultarClaude(
  mensaje: string,
  ctx: ContextoAsistente,
  rol: RolAsistente = 'comprador',
): Promise<RespuestaAsistenteIA> {
  const presupuesto = detectarPresupuesto(mensaje)
  const categoria = detectarCategoria(mensaje, ctx.productos)
  // Al comprador le mandamos los productos relevantes a su consulta; al vendedor,
  // sus propios productos (sin filtrar por stock ni presupuesto, para gestionarlos).
  const elegidos =
    rol === 'vendedor'
      ? ctx.productos.slice(0, 12)
      : filtrarRelevantes(mensaje, ctx.productos, presupuesto, categoria)
  const productos = elegidos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    categoria: p.categoria,
    marca: p.marca,
    precio: p.precio,
    stock: p.stock,
    descripcion: p.descripcion,
  }))

  // Solo enviamos lo necesario (mensaje limitado e historial recortado).
  const cuerpo = {
    mensaje: mensaje.slice(0, MAX_MENSAJE),
    historial: ctx.historial.slice(-MAX_HISTORIAL),
    productos,
    carrito: ctx.carrito,
    totalCarrito: ctx.totalCarrito,
    presupuesto,
    categoria,
    nombreCliente: ctx.nombreCliente,
    rol, // el servidor elige el "cerebro": ventas (comprador) o gestión (vendedor)
  }

  // Cancelamos si tarda demasiado (evita esperas eternas).
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE)

  let respuesta: Response
  try {
    respuesta = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
      signal: controlador.signal,
    })
  } finally {
    clearTimeout(temporizador)
  }

  if (!respuesta.ok) throw new Error('La API respondió con error ' + respuesta.status)

  let datos: any
  try {
    datos = await respuesta.json()
  } catch {
    throw new Error('La API devolvió una respuesta no válida.')
  }
  // Validamos la respuesta del servidor antes de confiar en ella.
  if (!datos || typeof datos.mensaje !== 'string') {
    throw new Error('Respuesta de la API incompleta.')
  }

  return {
    mensaje: datos.mensaje,
    productosRecomendados: Array.isArray(datos.productosRecomendados)
      ? datos.productosRecomendados.map((x: any) => String(x))
      : [],
    accionSugerida: datos.accionSugerida ?? 'NINGUNA',
  }
}

// FUNCIÓN CENTRAL: decide qué modo usar y SIEMPRE devuelve una respuesta.
//   - Si VITE_USAR_IA_REAL es true, intenta Claude; si falla, usa el modo simulado.
//   - Si es false, usa directamente el modo simulado.
export async function obtenerRespuestaAsistente(
  mensaje: string,
  ctx: ContextoAsistente,
  rol: RolAsistente = 'comprador',
): Promise<ResultadoAsistente> {
  const limpio = mensaje.trim()

  // No enviamos mensajes vacíos.
  if (limpio === '') return respuestaLocal(limpio, ctx, rol)

  // Modo simulado directo si la IA real está desactivada.
  if (!usarIAReal()) return respuestaLocal(limpio, ctx, rol)

  // Evitamos repetir el mismo mensaje mientras hay una solicitud en curso.
  if (solicitudEnCurso && limpio === ultimoEnviado) {
    return respuestaLocal(limpio, ctx, rol)
  }

  solicitudEnCurso = true
  ultimoEnviado = limpio
  try {
    const r = await consultarClaude(limpio, ctx, rol)
    return { ...r, fuente: 'ia' }
  } catch {
    // Si la IA real falla, usamos automáticamente el modo simulado.
    console.error('No se pudo utilizar la IA real; se usó el modo local.')
    return { ...respuestaLocal(limpio, ctx, rol), falloIA: true }
  } finally {
    solicitudEnCurso = false
  }
}
