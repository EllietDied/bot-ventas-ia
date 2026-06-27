// scripts/probar-v4pro.mjs
// -----------------------------------------------------------------------------
// Prueba LOCAL del asistente con el modelo nuevo de DeepSeek (deepseek-v4-pro),
// SIN desplegar a Vercel. Llama directo a la API de DeepSeek con el MISMO prompt
// y el mismo formato que usa api/chat.ts, para confirmar antes de desplegar que:
//   1) el nombre del modelo es válido,
//   2) los parámetros (thinking, reasoning_effort, response_format) son aceptados,
//   3) devuelve el JSON que la app espera (mensaje / productosRecomendados / accion),
//   4) cuánto tarda en responder (importa porque "piensa" antes de contestar).
//
// CÓMO USAR (tu clave NUNCA se sube al repo: .env.local está ignorado por git):
//   1) Crea un archivo .env.local en la raíz del proyecto con:
//        DEEPSEEK_API_KEY=sk-tu-clave-aqui
//   2) Ejecuta:   node scripts/probar-v4pro.mjs
//
// Requiere Node 18 o superior (usa fetch nativo).
// -----------------------------------------------------------------------------

import { readFileSync } from 'node:fs'

// --- 1) Cargar la clave desde .env.local / .env (sin librerías externas) ------
function cargarEnv(archivo) {
  try {
    for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
      const l = linea.trim()
      if (!l || l.startsWith('#')) continue
      const i = l.indexOf('=')
      if (i === -1) continue
      const clave = l.slice(0, i).trim()
      let valor = l.slice(i + 1).trim()
      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1)
      }
      if (!(clave in process.env)) process.env[clave] = valor
    }
  } catch {
    /* el archivo puede no existir: no pasa nada */
  }
}
cargarEnv('.env.local')
cargarEnv('.env')

const API_KEY = process.env.DEEPSEEK_API_KEY
const MODELO = process.env.DEEPSEEK_MODELO || 'deepseek-v4-pro'
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'

if (!API_KEY) {
  console.error(
    '\n❌ Falta DEEPSEEK_API_KEY.\n' +
      '   Crea un archivo .env.local en la raíz con:  DEEPSEEK_API_KEY=sk-...\n' +
      '   (o expórtala en la terminal antes de correr el script)\n',
  )
  process.exit(1)
}

// --- 2) El mismo "cerebro" que api/chat.ts (prompt de InkaBot) ----------------
const SISTEMA = `Eres InkaBot, el asistente de ventas de IA InkaShop. Atiendes a cada cliente como lo haría un buen vendedor de tienda: con calidez, cercanía y ganas reales de ayudar.

Tu objetivo es acompañar al comprador a encontrar, comparar y elegir productos del catálogo que te entrega el sistema.

CÓMO CONVERSAS (tu estilo, esto es lo más importante):
- Habla como una persona real, en español, con un tono cálido, natural y cercano. Nada de sonar robótico.
- El nombre del cliente es ÚNICAMENTE el que aparece en la sección "CLIENTE" del contexto. Salúdalo y dirígete a él por ESE nombre, de forma natural.
- Antes de recomendar, conecta en una frase con lo que busca el cliente (demuestra que lo entendiste).
- Sé claro y al grano, pero humano y con chispa.

REGLAS QUE NUNCA ROMPES:
- Expresa los precios en soles peruanos con el prefijo "S/" (por ejemplo, S/ 1450), nunca con "$".
- Recomienda SOLO productos presentes en el catálogo que te dio el sistema. No inventes productos ni precios.
- Prioriza los productos con stock disponible y respeta el presupuesto que indique el cliente.`

// --- 3) Catálogo + consulta de ejemplo (como los manda el frontend) -----------
const productos = [
  { id: 1, nombre: 'Laptop Lenovo IdeaPad 3', categoria: 'Laptops', marca: 'Lenovo', precio: 2499, stock: 7, descripcion: 'Ryzen 5, 16GB RAM, 512GB SSD' },
  { id: 2, nombre: 'Laptop Asus TUF Gaming F15', categoria: 'Laptops', marca: 'Asus', precio: 3899, stock: 3, descripcion: 'Core i7, RTX 4060, 16GB RAM' },
  { id: 3, nombre: 'Mouse Logitech G203', categoria: 'Accesorios', marca: 'Logitech', precio: 89, stock: 25, descripcion: 'Mouse gamer RGB' },
]
const nombreCliente = 'Beryher'
const mensajeUsuario = 'Hola, busco una laptop para programar, hasta 4000 soles. ¿Cuál me recomiendas?'

const contexto = [
  `CLIENTE (cuenta verificada, con sesión iniciada): el cliente se llama "${nombreCliente}". Dirígete a él SIEMPRE por este nombre.`,
  'CATÁLOGO DISPONIBLE (usa SOLO estos productos; cada uno trae su id real):',
  JSON.stringify(productos),
  '',
  'CARRITO ACTUAL: vacío',
  'PRESUPUESTO DETECTADO: hasta S/ 4000',
  'CATEGORÍA DE INTERÉS: Laptops',
  '',
  'Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, con esta forma exacta:',
  '{"mensaje": string, "productosRecomendados": string[], "accionSugerida": "VER_PRODUCTO" | "AGREGAR_CARRITO" | "COMPARAR" | "CONSULTAR_VENDEDOR" | "NINGUNA"}',
  '"productosRecomendados" debe contener solo ids (como texto) de productos del catálogo anterior.',
].join('\n')

const mensajes = [
  { role: 'system', content: SISTEMA + '\n\n' + contexto },
  { role: 'user', content: mensajeUsuario },
]

// --- 4) Misma lógica robusta de api/chat.ts para leer el JSON de la respuesta -
function interpretar(texto) {
  const inicio = texto.indexOf('{')
  const fin = texto.lastIndexOf('}')
  if (inicio !== -1 && fin > inicio) {
    try {
      const obj = JSON.parse(texto.slice(inicio, fin + 1))
      return {
        ok: true,
        mensaje: typeof obj.mensaje === 'string' ? obj.mensaje : texto,
        productosRecomendados: Array.isArray(obj.productosRecomendados) ? obj.productosRecomendados : [],
        accionSugerida: obj.accionSugerida ?? 'NINGUNA',
      }
    } catch {
      /* cae abajo */
    }
  }
  return { ok: false, mensaje: texto, productosRecomendados: [], accionSugerida: 'NINGUNA' }
}

// --- 5) Una llamada a DeepSeek con un conjunto concreto de parámetros ----------
async function llamar(extra) {
  const t0 = Date.now()
  const respuesta = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODELO, max_tokens: 1024, messages: mensajes, ...extra }),
  })
  const segundos = ((Date.now() - t0) / 1000).toFixed(1)
  const texto = await respuesta.text()
  let datos
  try {
    datos = JSON.parse(texto)
  } catch {
    datos = null
  }
  return { status: respuesta.status, ok: respuesta.ok, datos, textoCrudo: texto, segundos }
}

// --- 6) Prueba auto-diagnóstica: del set completo al mínimo ---------------------
// Si v4-pro rechaza algún parámetro, lo detectamos y reintentamos sin él.
const intentos = [
  {
    etiqueta: 'completo (thinking + reasoning_effort + response_format + temperature)',
    extra: { thinking: { type: 'enabled' }, reasoning_effort: 'high', response_format: { type: 'json_object' }, temperature: 0.8 },
  },
  {
    etiqueta: 'sin temperature',
    extra: { thinking: { type: 'enabled' }, reasoning_effort: 'high', response_format: { type: 'json_object' } },
  },
  {
    etiqueta: 'sin response_format (el JSON se extrae del texto)',
    extra: { thinking: { type: 'enabled' }, reasoning_effort: 'high' },
  },
  {
    etiqueta: 'solo reasoning_effort',
    extra: { reasoning_effort: 'high' },
  },
]

console.log('\n============================================================')
console.log(' Prueba local del modelo:', MODELO)
console.log(' Endpoint:', DEEPSEEK_URL)
console.log('============================================================\n')

let exito = false
for (const intento of intentos) {
  process.stdout.write(`▶ Probando configuración: ${intento.etiqueta} ...\n`)
  let r
  try {
    r = await llamar(intento.extra)
  } catch (e) {
    console.log(`  ✖ Error de red: ${e.message}\n`)
    continue
  }

  if (!r.ok) {
    const msg = r.datos?.error?.message || r.textoCrudo?.slice(0, 300) || '(sin detalle)'
    console.log(`  ✖ HTTP ${r.status} (${r.segundos}s) → ${msg}\n`)
    continue // probamos la siguiente configuración (quizá un parámetro no es compatible)
  }

  const mensajeModelo = r.datos?.choices?.[0]?.message ?? {}
  const contenido = mensajeModelo.content ?? ''
  const razonamiento = mensajeModelo.reasoning_content ?? ''
  const parsed = interpretar(contenido)

  console.log(`  ✔ HTTP 200 en ${r.segundos}s  ·  esta configuración FUNCIONA`)
  console.log('  ----------------------------------------------------------')
  if (razonamiento) {
    console.log(`  🧠 Pensamiento (reasoning_content): ${razonamiento.length} caracteres`)
    console.log(`     "${razonamiento.slice(0, 180).replace(/\s+/g, ' ')}..."`)
  } else {
    console.log('  🧠 (No vino reasoning_content separado en esta respuesta)')
  }
  console.log(`  📦 ¿El JSON se pudo leer?  ${parsed.ok ? 'SÍ ✔' : 'NO ✖'}`)
  console.log(`  💬 mensaje: ${parsed.mensaje}`)
  console.log(`  🛒 productosRecomendados: ${JSON.stringify(parsed.productosRecomendados)}`)
  console.log(`  ⚙️  accionSugerida: ${parsed.accionSugerida}`)
  console.log('  ----------------------------------------------------------')
  console.log('\n  Tokens (si los reporta):', JSON.stringify(r.datos?.usage ?? {}, null, 0), '\n')

  exito = true
  console.log('👉 Usa ESTA configuración en api/chat.ts (la del cuerpo del fetch).')
  if (intento.etiqueta !== intentos[0].etiqueta) {
    console.log('   OJO: la configuración "completa" no funcionó; ajusta api/chat.ts a la que sí.')
  }
  break
}

if (!exito) {
  console.log('============================================================')
  console.log('❌ Ninguna configuración funcionó. Revisa:')
  console.log('   - ¿El nombre del modelo "' + MODELO + '" es correcto y tu cuenta tiene acceso?')
  console.log('   - ¿La clave DEEPSEEK_API_KEY es válida y tiene saldo?')
  console.log('   - El detalle del error aparece arriba en cada intento (HTTP 4xx).')
  console.log('============================================================\n')
  process.exit(1)
}
