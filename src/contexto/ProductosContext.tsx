import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Producto } from '../core/modelos/Producto'
import { buscarProductos, obtenerCategorias } from '../core/servicios/CatalogoService'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { PRODUCTOS_INICIALES } from '../core/datos/seed'

// Datos del formulario para publicar un producto.
export interface NuevoProducto {
  nombre: string
  descripcion: string
  categoria: string
  precio: number
  stock: number
  idVendedor: string
}

interface ProductosContextType {
  productos: Producto[]
  buscar: (termino: string) => Producto[]
  categorias: string[]
  publicarProducto: (datos: NuevoProducto) => void
  actualizarStock: (id: number, nuevoStock: number) => void
}

const ProductosContext = createContext<ProductosContextType | undefined>(undefined)

export function ProductosProvider({ children }: { children: ReactNode }) {
  // LISTA de productos (arreglo Producto[]). Se carga desde localStorage.
  const [productos, setProductos] = useState<Producto[]>(() =>
    cargar('productos', PRODUCTOS_INICIALES),
  )

  useEffect(() => guardar('productos', productos), [productos])

  function buscar(termino: string): Producto[] {
    return buscarProductos(termino, productos)
  }

  // El vendedor publica un nuevo producto.
  function publicarProducto(datos: NuevoProducto) {
    const nuevoId = productos.reduce((max, p) => Math.max(max, p.id), 0) + 1
    const producto: Producto = {
      id: nuevoId,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      categoria: datos.categoria,
      precio: datos.precio,
      stock: datos.stock,
      estado: datos.stock > 0 ? 'disponible' : 'agotado',
      imagen: '📦',
      idVendedor: datos.idVendedor,
    }
    setProductos((prev) => [...prev, producto])
  }

  // El vendedor (o una compra) actualiza el stock de un producto.
  function actualizarStock(id: number, nuevoStock: number) {
    setProductos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, stock: nuevoStock, estado: nuevoStock > 0 ? 'disponible' : 'agotado' }
          : p,
      ),
    )
  }

  const categorias = obtenerCategorias(productos)

  return (
    <ProductosContext.Provider
      value={{ productos, buscar, categorias, publicarProducto, actualizarStock }}
    >
      {children}
    </ProductosContext.Provider>
  )
}

export function useProductos() {
  const ctx = useContext(ProductosContext)
  if (!ctx) throw new Error('useProductos debe usarse dentro de ProductosProvider')
  return ctx
}
