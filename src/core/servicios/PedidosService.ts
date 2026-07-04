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

// Inserta un pedido y sus líneas; devuelve el Pedido creado (con su id real).
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

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .insert({
      id_comprador: p.idComprador,
      correo_comprador: p.correoComprador,
      subtotal: p.subtotal,
      descuento: p.descuento,
      total: p.total,
      metodo_pago: p.metodoPago,
      banco: p.banco ?? null,
      estado: 'pendiente',
      estado_pago: 'aprobado',
    })
    .select()
    .single()
  if (error || !pedido) return null

  const filasDetalle: FilaDetalle[] = p.items.map((i) => ({
    pedido_id: (pedido as FilaPedido).id,
    producto_id: i.producto.id,
    nombre: i.producto.nombre,
    cantidad: i.cantidad,
    precio: i.producto.precio,
  }))
  if (filasDetalle.length > 0) await supabase.from('detalle_pedido').insert(filasDetalle)

  return mapPedido(pedido as FilaPedido, filasDetalle)
}

// Marca un pedido como atendido.
export async function atenderPedidoSupabase(id: number): Promise<void> {
  if (!supabase) return
  await supabase.from('pedidos').update({ estado: 'atendido' }).eq('id', id)
}

// Guarda la dirección de envío elegida en el pedido.
export async function actualizarEnvioSupabase(id: number, envio: Direccion): Promise<void> {
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
    })
    .eq('id', id)
}
