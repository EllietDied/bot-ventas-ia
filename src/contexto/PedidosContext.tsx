import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Pedido } from '../core/modelos/Pedido'
import { Pago, MetodoPago } from '../core/modelos/Pago'
import { DetallePedido } from '../core/modelos/DetallePedido'
import { ItemCarrito } from '../core/modelos/Carrito'
import { ColaPedidos } from '../core/estructuras/ColaPedidos'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { usarSupabase } from '../core/datos/supabase'
import {
  listarPedidosSupabase,
  insertarPedidoSupabase,
  atenderPedidoSupabase,
} from '../core/servicios/PedidosService'
import { useSesion } from './SesionContext'

// Datos necesarios para registrar un pedido.
export interface DatosPedido {
  correoComprador: string
  items: ItemCarrito[]
  subtotal: number
  descuento: number
  total: number
  metodoPago: MetodoPago
  banco?: string // solo si el método es transferencia
}

interface PedidosContextType {
  pedidos: Pedido[]
  pedidosPendientes: Pedido[] // en orden FIFO (el más antiguo primero)
  registrarPedido: (datos: DatosPedido) => void
  atenderSiguiente: () => Pedido | undefined
  pedidosDe: (correo: string) => Pedido[]
}

const PedidosContext = createContext<PedidosContextType | undefined>(undefined)

// Construye una COLA (FIFO) con los pedidos que están pendientes.
function construirCola(pedidos: Pedido[]): ColaPedidos {
  const cola = new ColaPedidos()
  // Encolamos del más antiguo al más nuevo para respetar el orden FIFO.
  pedidos
    .filter((p) => p.estado === 'pendiente')
    .slice()
    .reverse()
    .forEach((p) => cola.encolar(p))
  return cola
}

export function PedidosProvider({ children }: { children: ReactNode }) {
  const { usuarioActual } = useSesion()

  // LISTA de pedidos (los más recientes primero).
  // En modo local desde localStorage; con Supabase, desde la base.
  const [pedidos, setPedidos] = useState<Pedido[]>(() =>
    usarSupabase() ? [] : cargar<Pedido[]>('pedidos', []),
  )

  // Guardamos en localStorage SOLO en el modo local.
  useEffect(() => {
    if (!usarSupabase()) guardar('pedidos', pedidos)
  }, [pedidos])

  // Con Supabase: al cargar, traemos los pedidos accesibles (el RLS ya filtra).
  useEffect(() => {
    if (!usarSupabase()) return
    let activo = true
    listarPedidosSupabase().then((lista) => {
      if (activo) setPedidos(lista)
    })
    return () => {
      activo = false
    }
  }, [])

  // ALGORITMO RegistrarPedido + ProcesarPago (pago simulado).
  async function registrarPedido(datos: DatosPedido) {
    if (usarSupabase()) {
      const creado = await insertarPedidoSupabase({
        idComprador: usuarioActual?.idUsuario ?? '',
        correoComprador: datos.correoComprador,
        items: datos.items,
        subtotal: datos.subtotal,
        descuento: datos.descuento,
        total: datos.total,
        metodoPago: datos.metodoPago,
        banco: datos.banco,
      })
      if (creado) setPedidos((prev) => [creado, ...prev])
      return
    }

    // Modo local.
    const detalles: DetallePedido[] = datos.items.map((i) => ({
      idProducto: i.producto.id,
      nombreProducto: i.producto.nombre,
      cantidad: i.cantidad,
      precioUnitario: i.producto.precio,
      subtotal: i.producto.precio * i.cantidad,
    }))

    const pago: Pago = {
      idPago: 'PG-' + Date.now(),
      metodoPago: datos.metodoPago,
      banco: datos.banco,
      monto: datos.total,
      estadoPago: 'aprobado', // el pago es simulado
      fechaPago: new Date().toLocaleString(),
    }

    const pedido: Pedido = {
      idPedido: 'PED-' + Date.now(),
      correoComprador: datos.correoComprador,
      fecha: new Date().toLocaleString(),
      detalles,
      subtotal: datos.subtotal,
      descuento: datos.descuento,
      total: datos.total,
      estado: 'pendiente',
      pago,
    }

    setPedidos((prev) => [pedido, ...prev]) // el más reciente va primero
  }

  // Atiende el primer pedido pendiente usando la cola FIFO.
  function atenderSiguiente(): Pedido | undefined {
    const cola = construirCola(pedidos)
    const siguiente = cola.desencolar() // FIFO: sale el más antiguo
    if (!siguiente) return undefined
    // Con Supabase, persistimos en segundo plano (la UI se actualiza al instante).
    if (usarSupabase()) atenderPedidoSupabase(Number(siguiente.idPedido))
    setPedidos((prev) =>
      prev.map((p) => (p.idPedido === siguiente.idPedido ? { ...p, estado: 'atendido' } : p)),
    )
    return siguiente
  }

  function pedidosDe(correo: string): Pedido[] {
    return pedidos.filter((p) => p.correoComprador === correo)
  }

  const pedidosPendientes = construirCola(pedidos).listar()

  return (
    <PedidosContext.Provider
      value={{ pedidos, pedidosPendientes, registrarPedido, atenderSiguiente, pedidosDe }}
    >
      {children}
    </PedidosContext.Provider>
  )
}

export function usePedidos() {
  const ctx = useContext(PedidosContext)
  if (!ctx) throw new Error('usePedidos debe usarse dentro de PedidosProvider')
  return ctx
}
