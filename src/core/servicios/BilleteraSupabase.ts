// BilleteraSupabase.ts
// Puente entre el frontend y la base de datos para la billetera en PRODUCCIÓN.
// El saldo real vive en la tabla `billeteras`, y el pago con saldo lo hace la
// función `pagar_con_saldo` DENTRO del servidor (segura y atómica). En modo local
// no se usa nada de esto: ahí la billetera funciona con localStorage.
import { supabase } from '../datos/supabase'

// Un producto del carrito, tal como lo recibe la función del servidor.
export interface ItemCompra {
  producto_id: number
  nombre: string
  cantidad: number
}

// Resultado de pagar con saldo (lo que devuelve la función del servidor).
export interface ResultadoPagoSaldo {
  ok: boolean
  error?: string
  pedidoId?: number
  total?: number
}

// Lee el saldo real del usuario con sesión desde la base de datos.
export async function cargarSaldoServidor(): Promise<number> {
  if (!supabase) return 0
  const { data: sesion } = await supabase.auth.getSession()
  const uid = sesion.session?.user?.id
  if (!uid) return 0
  const { data, error } = await supabase
    .from('billeteras')
    .select('saldo')
    .eq('id', uid)
    .single()
  if (error || !data) return 0
  return Number(data.saldo)
}

// Paga una compra con el saldo llamando a la función del servidor. El servidor
// calcula el total con los precios reales, valida el saldo y descuenta: el
// navegador NO decide cuánto se cobra.
export async function pagarConSaldoServidor(items: ItemCompra[]): Promise<ResultadoPagoSaldo> {
  if (!supabase) return { ok: false, error: 'Sin conexión con el servidor.' }
  const { data, error } = await supabase.rpc('pagar_con_saldo', { items })
  if (error) return { ok: false, error: 'No se pudo completar el pago.' }
  const r = (data ?? {}) as { ok?: boolean; error?: string; pedido_id?: number; total?: number }
  return { ok: !!r.ok, error: r.error, pedidoId: r.pedido_id, total: r.total }
}
