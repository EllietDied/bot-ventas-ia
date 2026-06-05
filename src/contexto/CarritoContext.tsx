import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Producto } from '../core/modelos/Producto'
import { Carrito, ItemCarrito } from '../core/modelos/Carrito'
import { cargar, guardar } from '../core/datos/almacenamiento'

interface CarritoContextType {
  items: ItemCarrito[]
  subtotal: number
  descuento: number
  total: number
  cantidadTotal: number
  agregarAlCarrito: (producto: Producto) => void
  quitarDelCarrito: (idProducto: number) => void
  cambiarCantidad: (idProducto: number, cantidad: number) => void
  vaciarCarrito: () => void
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined)

export function CarritoProvider({ children }: { children: ReactNode }) {
  // Items del carrito (se guardan en localStorage).
  const [items, setItems] = useState<ItemCarrito[]>(() => cargar<ItemCarrito[]>('carrito', []))

  useEffect(() => guardar('carrito', items), [items])

  // Creamos un objeto Carrito para usar su lógica de cálculo.
  const carrito = new Carrito(items)
  const subtotal = carrito.calcularSubtotal()
  const descuento = carrito.calcularDescuento()
  const total = carrito.calcularTotal()
  const cantidadTotal = carrito.cantidadTotal()

  function agregarAlCarrito(producto: Producto) {
    setItems((prev) => {
      const c = new Carrito(prev)
      c.agregarProducto(producto)
      return c.obtenerItems()
    })
  }

  function quitarDelCarrito(idProducto: number) {
    setItems((prev) => {
      const c = new Carrito(prev)
      c.eliminarProducto(idProducto)
      return c.obtenerItems()
    })
  }

  function cambiarCantidad(idProducto: number, cantidad: number) {
    setItems((prev) => {
      const c = new Carrito(prev)
      c.cambiarCantidad(idProducto, cantidad)
      return c.obtenerItems()
    })
  }

  function vaciarCarrito() {
    setItems([])
  }

  return (
    <CarritoContext.Provider
      value={{
        items,
        subtotal,
        descuento,
        total,
        cantidadTotal,
        agregarAlCarrito,
        quitarDelCarrito,
        cambiarCantidad,
        vaciarCarrito,
      }}
    >
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const ctx = useContext(CarritoContext)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider')
  return ctx
}
