import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Producto } from '../core/modelos/Producto'
import { buscarProductos, obtenerCategorias } from '../core/servicios/CatalogoService'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { PRODUCTOS_INICIALES } from '../core/datos/seed'

// Datos del formulario para publicar un producto.
export interface NuevoProducto {
  nombre: string
  marca?: string
  descripcion: string
  categoria: string
  precio: number
  stock: number
  idVendedor: string
  imagen?: string // foto subida (dataURL); si no, se usa un emoji por defecto
}

interface ProductosContextType {
  productos: Producto[]
  buscar: (termino: string) => Producto[]
  categorias: string[]
  publicarProducto: (datos: NuevoProducto) => void
  actualizarStock: (id: number, nuevoStock: number) => void
  actualizarImagen: (id: number, imagen: string) => void
  editarProducto: (id: number, cambios: Partial<Producto>) => void
  eliminarProducto: (id: number) => void
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
      marca: datos.marca?.trim() || undefined,
      descripcion: datos.descripcion,
      categoria: datos.categoria,
      precio: datos.precio,
      stock: datos.stock,
      estado: datos.stock > 0 ? 'disponible' : 'agotado',
      imagen: datos.imagen || '📦', // foto subida o, si no hay, un emoji por defecto
      idVendedor: datos.idVendedor,
    }
    setProductos((prev) => [...prev, producto])
  }

  // El vendedor cambia la foto de un producto ya publicado.
  function actualizarImagen(id: number, imagen: string) {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, imagen } : p)))
  }

  // El vendedor elimina (da de baja) uno de sus productos del catálogo.
  function eliminarProducto(id: number) {
    setProductos((prev) => prev.filter((p) => p.id !== id))
  }

  // Editor general: aplica cambios parciales a un producto (nombre, precio,
  // stock, etc.). Si cambia el stock, recalcula el estado disponible/agotado.
  function editarProducto(id: number, cambios: Partial<Producto>) {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const actualizado = { ...p, ...cambios }
        if (cambios.stock !== undefined) {
          actualizado.estado = cambios.stock > 0 ? 'disponible' : 'agotado'
        }
        return actualizado
      }),
    )
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
      value={{
        productos,
        buscar,
        categorias,
        publicarProducto,
        actualizarStock,
        actualizarImagen,
        editarProducto,
        eliminarProducto,
      }}
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
