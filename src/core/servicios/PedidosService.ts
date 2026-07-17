// Capa de datos de PEDIDOS en Supabase (modo "real").
// Un pedido (tabla "pedidos") tiene varias líneas (tabla "detalle_pedido").
// El mapeo traduce entre las columnas (snake_case) y el modelo Pedido de la app.
import { supabase } from '../datos/supabase'
import { Pedido, EstadoPedido } from '../modelos/Pedido'
import { ItemCarrito } from '../modelos/Carrito'
import { MetodoPago } from '../modelos/Pago'
import { Direccion } from '../modelos/Direccion'

interface FilaPedido {
  id: number | string
  correo_comprador: string | null
  subtotal: number | string | null
  descuento: number | string | null
  total: number | string | null
  metodo_pago: string | null
  banco: string | null
  estado: string | null
  estado_pago: string | null
  creado_en: string | null
  envio_receptor?: string | null
  envio_telefono?: string | null
  envio_direccion?: string | null
  envio_referencia?: string | null
  envio_dni?: string | null
  envio_departamento?: string | null
  envio_provincia?: string | null
  envio_distrito?: string | null
  envio_correo?: string | null
  envio_empresa?: string | null
}

interface FilaDetalle {
  pedido_id: number | string
  producto_id: number | string | null
  nombre: string | null
  cantidad: number | string | null
  precio: number | string | null
}

// Convierte una fila de "pedidos" (+ sus detalles) al modelo Pedido.
function mapPedido(fila: FilaPedido, detalles: FilaDetalle[]): Pedido {
  const fecha = fila.creado_en ? new Date(fila.creado_en).toLocaleString() : ''
  return {
    idPedido: String(fila.id),
    correoComprador: fila.correo_comprador ?? '',
    fecha,
    detalles: detalles.map((d) => {
      const cantidad = Number(d.cantidad ?? 0)
      const precio = Number(d.precio ?? 0)
      return {
        idProducto: Number(d.producto_id ?? 0),
        nombreProducto: d.nombre ?? '',
        cantidad,
        precioUnitario: precio,
        subtotal: precio * cantidad,
      }
    }),
    subtotal: Number(fila.subtotal ?? 0),
    descuento: Number(fila.descuento ?? 0),
    total: Number(fila.total ?? 0),
    estado: (fila.estado as EstadoPedido) ?? 'pendiente',
    pago: {
      idPago: 'PG-' + fila.id,
      metodoPago: (fila.metodo_pago as MetodoPago) ?? 'tarjeta',
      banco: fila.banco ?? undefined,
      monto: Number(fila.total ?? 0),
      estadoPago: fila.estado_pago ?? 'aprobado',
      fechaPago: fecha,
    },
    envio: fila.envio_direccion
      ? {
          id: 'env-' + fila.id,
          receptor: fila.envio_receptor ?? '',
          telefono: fila.envio_telefono ?? '',
          direccion: fila.envio_direccion,
          referencia: fila.envio_referencia ?? '',
          dni: fila.envio_dni ?? '',
          departamento: fila.envio_departamento ?? '',
          provincia: fila.envio_provincia ?? '',
          distrito: fila.envio_distrito ?? '',
          correo: fila.envio_correo ?? '',
        }
      : undefined,
    empresaEnvio: fila.envio_empresa ?? undefined,
  }
}

// Lee los pedidos accesibles (el RLS ya filtra: comprador ve los suyos, vendedor
// los que tienen sus productos). Los más recientes primero.
export async function listarPedidosSupabase(): Promise<Pedido[]> {
  if (!supabase) return []
  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('creado_en', { ascending: false })
  if (error || !pedidos) return []

  const ids = (pedidos as FilaPedido[]).map((p) => p.id)
  const { data: detalles } = await supabase.from('detalle_pedido').select('*').in('pedido_id', ids)

  const porPedido = new Map<string, FilaDetalle[]>()
  for (const d of (detalles as FilaDetalle[]) ?? []) {
    const clave = String(d.pedido_id)
    const lista = porPedido.get(clave) ?? []
    lista.push(d)
    porPedido.set(clave, lista)
  }

  return (pedidos as FilaPedido[]).map((p) => mapPedido(p, porPedido.get(String(p.id)) ?? []))
}

// Crea un pedido de forma SEGURA llamando a la función del servidor `crear_pedido`,
// que calcula el total con los PRECIOS REALES del catálogo (el navegador ya no puede
// inventar precios). Devuelve el Pedido creado, o null si falló.
export async function insertarPedidoSupabase(p: {
  idComprador: string
  correoComprador: string
  items: ItemCarrito[]
  subtotal: number
  descuento: number
  total: number
  metodoPago: MetodoPago
  banco?: string
}): Promise<Pedido | null> {
  if (!supabase) return null

  // Solo mandamos qué producto y cuánto: el precio lo pone el servidor.
  const items = p.items.map((i) => ({
    producto_id: i.producto.id,
    cantidad: i.cantidad,
    nombre: i.producto.nombre,
  }))
  const { data, error } = await supabase.rpc('crear_pedido', {
    items,
    metodo: p.metodoPago,
    banco: p.banco ?? null,
  })
  const r = data as { ok?: boolean; pedido_id?: number; subtotal?: number; descuento?: number; total?: number } | null
  if (error || !r || r.ok !== true || !r.pedido_id) return null

  // Reconstruimos el Pedido para la interfaz con los totales REALES de la función.
  const ahora = new Date().toLocaleString()
  return {
    idPedido: String(r.pedido_id),
    correoComprador: p.correoComprador,
    fecha: ahora,
    detalles: p.items.map((i) => ({
      idProducto: Number(i.producto.id),
      nombreProducto: i.producto.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.producto.precio,
      subtotal: i.producto.precio * i.cantidad,
    })),
    subtotal: Number(r.subtotal ?? p.subtotal),
    descuento: Number(r.descuento ?? p.descuento),
    total: Number(r.total ?? p.total),
    estado: 'pendiente',
    pago: {
      idPago: 'PG-' + r.pedido_id,
      metodoPago: p.metodoPago,
      banco: p.banco,
      monto: Number(r.total ?? p.total),
      estadoPago: 'aprobado',
      fechaPago: ahora,
    },
  }
}

// Marca un pedido como atendido.
export async function atenderPedidoSupabase(id: number): Promise<void> {
  if (!supabase) return
  await supabase.from('pedidos').update({ estado: 'atendido' }).eq('id', id)
}

// Guarda la dirección de envío elegida en el pedido.
export async function actualizarEnvioSupabase(
  id: number,
  envio: Direccion,
  empresa?: string,
): Promise<void> {
  if (!supabase) return
  await supabase
    .from('pedidos')
    .update({
      envio_receptor: envio.receptor,
      envio_telefono: envio.telefono,
      envio_direccion: envio.direccion,
      envio_referencia: envio.referencia ?? null,
      envio_dni: envio.dni ?? null,
      envio_departamento: envio.departamento ?? null,
      envio_provincia: envio.provincia ?? null,
      envio_distrito: envio.distrito ?? null,
      envio_correo: envio.correo ?? null,
      envio_empresa: empresa ?? null,
    })
    .eq('id', id)
}
