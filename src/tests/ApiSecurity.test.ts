import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '../../api/_types.js'

function respuesta() {
  const estado = { codigo: 0, cuerpo: undefined as unknown }
  const res: VercelResponse = {
    setHeader: vi.fn().mockReturnThis(),
    status: vi.fn((codigo: number) => {
      estado.codigo = codigo
      return res
    }),
    json: vi.fn((cuerpo: unknown) => {
      estado.cuerpo = cuerpo
      return res
    }),
    send: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  }
  return { res, estado }
}

function peticion(method: string, body: unknown): VercelRequest {
  return {
    method,
    headers: { authorization: 'Bearer token-valido' },
    query: {},
    body,
  }
}

describe('regresiones de seguridad de las API', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('SUPABASE_URL', 'https://proyecto.supabase.co')
    vi.stubEnv('SUPABASE_ANON_KEY', 'anon-publica')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-publica')
    vi.stubEnv('CULQI_SECRET_KEY', 'culqi-secreta')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('crea pedidos por RPC sin reenviar precios ni totales del cliente', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'usuario-1' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            pedido_id: 7,
            subtotal: 100,
            descuento: 0,
            total: 100,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 7, total: 100, detalle_pedido: [] }]), {
          status: 200,
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { default: handler } = await import('../../api/pedidos.js')
    const { res, estado } = respuesta()
    await handler(
      peticion('POST', {
        subtotal: 0.01,
        descuento: 9999,
        total: 0,
        items: [{ idProducto: 2, cantidad: 1, precio: 0.01, nombre: 'Inventado' }],
      }),
      res,
    )

    expect(estado.codigo).toBe(201)
    expect(String(fetchMock.mock.calls[1][0])).toContain('/rest/v1/rpc/crear_pedido')
    const rpcBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body))
    expect(rpcBody).toEqual({
      items: [{ producto_id: 2, cantidad: 1 }],
      metodo: 'tarjeta',
      banco: null,
    })
    expect(JSON.stringify(rpcBody)).not.toContain('0.01')
    expect(JSON.stringify(rpcBody)).not.toContain('Inventado')
  })

  it('rechaza cantidades inválidas antes de crear el pedido', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'usuario-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { default: handler } = await import('../../api/pedidos.js')
    const { res, estado } = respuesta()
    await handler(peticion('POST', { items: [{ idProducto: 2, cantidad: -1 }] }), res)

    expect(estado.codigo).toBe(400)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('no permite iniciar una compra real con un monto elegido por el cliente', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { default: handler } = await import('../../api/pago-crear.js')
    const { res, estado } = respuesta()
    await handler(peticion('POST', { monto: 10, concepto: 'compra', metodo: 'pagoefectivo' }), res)

    expect(estado.codigo).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
