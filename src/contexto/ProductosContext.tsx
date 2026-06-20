import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Producto } from '../core/modelos/Producto'
import { buscarProductos, obtenerCategorias } from '../core/servicios/CatalogoService'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { PRODUCTOS_INICIALES } from '../core/datos/seed'
import { usarSupabase } from '../core/datos/supabase'
import {
  listarProductosSupabase,
  insertarProductoSupabase,
  actualizarProductoSupabase,
  eliminarProductoSupabase,
} from '../core/servicios/ProductosService'
import { useSesion } from './SesionContext'

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
  const { usuarioActual } = useSesion()

  // LISTA de productos (arreglo Producto[]).
  // En modo local se carga desde localStorage; con Supabase, desde la base.
  const [productos, setProductos] = useState<Producto[]>(() =>
    usarSupabase() ? [] : cargar('productos', PRODUCTOS_INICIALES),
  )

  // Guardamos en localStorage SOLO en el modo local (con Supabase los datos viven en la base).
  useEffect(() => {
    if (!usarSupabase()) guardar('productos', productos)
  }, [productos])

  // Con Supabase: al cargar, traemos el catálogo desde la base.
  useEffect(() => {
    if (!usarSupabase()) return
    let activo = true
    listarProductosSupabase().then((lista) => {
      if (activo) setProductos(lista)
    })
    return () => {
      activo = false
    }
  }, [])

  function buscar(termino: string): Producto[] {
    return buscarProductos(termino, productos)
  }

  // El vendedor publica un nuevo producto.
  async function publicarProducto(datos: NuevoProducto) {
    const estado = datos.stock > 0 ? 'disponible' : 'agotado'
    const imagen = datos.imagen || '📦'
    const marca = datos.marca?.trim() || undefined

    if (usarSupabase()) {
      const creado = await insertarProductoSupabase({
        nombre: datos.nombre,
        marca,
        descripcion: datos.descripcion,
        categoria: datos.categoria,
        precio: datos.precio,
        stock: datos.stock,
        estado,
        imagen,
        idVendedor: datos.idVendedor,
        vendedorNombre: usuarioActual
          ? `${usuarioActual.nombre} ${usuarioActual.apellido}`.trim()
          : '',
      })
      if (creado) setProductos((prev) => [...prev, creado])
      return
    }

    // Modo local: id incremental en memoria.
    const nuevoId = productos.reduce((max, p) => Math.max(max, p.id), 0) + 1
    const producto: Producto = {
      id: nuevoId,
      nombre: datos.nombre,
      marca,
      descripcion: datos.descripcion,
      categoria: datos.categoria,
      precio: datos.precio,
      stock: datos.stock,
      estado,
      imagen,
      idVendedor: datos.idVendedor,
    }
    setProductos((prev) => [...prev, producto])
  }

  // Editor general: aplica cambios parciales. Si cambia el stock, recalcula el estado.
  function editarProducto(id: number, cambios: Partial<Producto>) {
    const conEstado: Partial<Producto> = { ...cambios }
    if (cambios.stock !== undefined) {
      conEstado.estado = cambios.stock > 0 ? 'disponible' : 'agotado'
    }
    // Con Supabase, persistimos en segundo plano (la UI se actualiza al instante).
    if (usarSupabase()) actualizarProductoSupabase(id, conEstado)
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...conEstado } : p)))
  }

  // El vendedor cambia la foto de un producto ya publicado.
  function actualizarImagen(id: number, imagen: string) {
    editarProducto(id, { imagen })
  }

  // El vendedor (o una compra) actualiza el stock de un producto.
  function actualizarStock(id: number, nuevoStock: number) {
    editarProducto(id, { stock: nuevoStock })
  }

  // El vendedor elimina (da de baja) uno de sus productos del catálogo.
  function eliminarProducto(id: number) {
    if (usarSupabase()) eliminarProductoSupabase(id)
    setProductos((prev) => prev.filter((p) => p.id !== id))
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
