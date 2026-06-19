import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  obtenerRespuestaAsistente,
  resolverProductos,
  type ContextoAsistente,
  type MensajeHistorial,
} from './AsistenteIAService'
import { Producto } from '../modelos/Producto'

// Catálogo de prueba (id 2 está agotado).
const PRODUCTOS: Producto[] = [
  {
    id: 1,
    nombre: 'Mouse Gamer',
    categoria: 'Periféricos',
    marca: 'Logitech',
    descripcion: 'Mouse',
    precio: 90,
    stock: 10,
    estado: 'disponible',
    imagen: '🖱️',
  },
  {
    id: 2,
    nombre: 'Teclado',
    categoria: 'Periféricos',
    descripcion: 'Teclado',
    precio: 200,
    stock: 0,
    estado: 'agotado',
    imagen: '⌨️',
  },
  {
    id: 3,
    nombre: 'Monitor',
    categoria: 'Monitores',
    descripcion: 'Monitor',
    precio: 800,
    stock: 5,
    estado: 'disponible',
    imagen: '🖥️',
  },
]

function ctxBase(historial: MensajeHistorial[] = []): ContextoAsistente {
  return { productos: PRODUCTOS, categoriasConsultadas: [], carrito: [], totalCarrito: 0, historial }
}

// Una respuesta válida simulada de la API.
function respuestaOk(datos: any) {
  return { ok: true, json: async () => datos }
}

describe('AsistenteIAService', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('1) usa el modo simulado cuando VITE_USAR_IA_REAL es false', async () => {
    vi.stubEnv('VITE_USAR_IA_REAL', 'false')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const r = await obtenerRespuestaAsistente('hola', ctxBase())

    expect(r.fuente).toBe('local')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(r.mensaje.length).toBeGreaterThan(0)
  })

  it('2) intenta consultar /api/chat cuando VITE_USAR_IA_REAL es true', async () => {
    vi.stubEnv('VITE_USAR_IA_REAL', 'true')
    const fetchMock = vi.fn().mockResolvedValue(
      respuestaOk({ mensaje: 'Hola desde la IA', productosRecomendados: ['1'], accionSugerida: 'NINGUNA' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const r = await obtenerRespuestaAsistente('busco un mouse', ctxBase())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/chat')
    expect(r.fuente).toBe('ia')
    expect(r.mensaje).toBe('Hola desde la IA')
  })

  it('3) si la API falla, cae automáticamente al modo simulado', async () => {
    vi.stubEnv('VITE_USAR_IA_REAL', 'true')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('red caída')))

    const r = await obtenerRespuestaAsistente('hola', ctxBase())

    expect(r.fuente).toBe('local')
    expect(r.falloIA).toBe(true)
  })

  it('4) no envía mensajes vacíos a la API', async () => {
    vi.stubEnv('VITE_USAR_IA_REAL', 'true')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const r = await obtenerRespuestaAsistente('   ', ctxBase())

    expect(fetchMock).not.toHaveBeenCalled()
    expect(r.fuente).toBe('local')
  })

  it('5) limita el mensaje a 1000 caracteres', async () => {
    vi.stubEnv('VITE_USAR_IA_REAL', 'true')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respuestaOk({ mensaje: 'ok', productosRecomendados: [], accionSugerida: 'NINGUNA' }))
    vi.stubGlobal('fetch', fetchMock)

    await obtenerRespuestaAsistente('a'.repeat(1500), ctxBase())

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.mensaje.length).toBe(1000)
  })

  it('6) limita el historial a los últimos 10 mensajes', async () => {
    vi.stubEnv('VITE_USAR_IA_REAL', 'true')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respuestaOk({ mensaje: 'ok', productosRecomendados: [], accionSugerida: 'NINGUNA' }))
    vi.stubGlobal('fetch', fetchMock)

    const historial: MensajeHistorial[] = Array.from({ length: 15 }, (_, i) => ({
      rol: 'usuario',
      texto: 'm' + i,
    }))
    await obtenerRespuestaAsistente('hola', ctxBase(historial))

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.historial.length).toBe(10)
  })

  it('7) no envía a la IA productos sin stock', async () => {
    vi.stubEnv('VITE_USAR_IA_REAL', 'true')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(respuestaOk({ mensaje: 'ok', productosRecomendados: [], accionSugerida: 'NINGUNA' }))
    vi.stubGlobal('fetch', fetchMock)

    await obtenerRespuestaAsistente('quiero algo', ctxBase())

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.productos.every((p: any) => p.stock > 0)).toBe(true)
    expect(body.productos.find((p: any) => p.id === 2)).toBeUndefined()
  })

  it('8) descarta ids de productos inventados (resolverProductos)', () => {
    const encontrados = resolverProductos(['1', '999', '3'], PRODUCTOS)
    expect(encontrados.map((p) => p.id)).toEqual([1, 3])
  })

  it('9) no duplica una solicitud simultánea con el mismo mensaje', async () => {
    vi.stubEnv('VITE_USAR_IA_REAL', 'true')
    let resolver: (v: any) => void = () => {}
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((res) => {
          resolver = res
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const p1 = obtenerRespuestaAsistente('mismo', ctxBase())
    const p2 = obtenerRespuestaAsistente('mismo', ctxBase())

    // El segundo (duplicado mientras hay uno en curso) usa el modo local, sin un segundo fetch.
    const r2 = await p2
    expect(r2.fuente).toBe('local')

    // Cerramos la primera solicitud.
    resolver(respuestaOk({ mensaje: 'ok', productosRecomendados: [], accionSugerida: 'NINGUNA' }))
    await p1
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('10) valida la respuesta del servidor (sin "mensaje" => modo local)', async () => {
    vi.stubEnv('VITE_USAR_IA_REAL', 'true')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaOk({ foo: 'bar' })))

    const r = await obtenerRespuestaAsistente('hola', ctxBase())

    expect(r.fuente).toBe('local')
    expect(r.falloIA).toBe(true)
  })
})
