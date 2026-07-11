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
  subirImagenProducto,
} from '../core/servicios/ProductosService'
import {
  crearProductoLocal,
  editarEnLista,
  eliminarEnLista,
} from '../core/servicios/ProductosLocal'
import { useSesion } from './SesionContext'

// Datos del formulario para publicar un producto.
export interface NuevoProducto {
  nombre: string
  marca?: string
  modelo?: string
  material?: string
  descripcion: string
  caracteristicas?: string
  categoria: string
  precio: number
  stock: number
  idVendedor: string
  imagen?: string // (compatibilidad) una sola foto subida por el chat del vendedor
  imagenes?: string[] // galería: varias fotos subidas (dataURLs); la 1ª es la principal
}

interface ProductosContextType {
  productos: Producto[]
  buscar: (termino: string) => Producto[]
  categorias: string[]
  publicarProducto: (datos: NuevoProducto) => Promise<Producto | null>
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

  // El vendedor publica un nuevo producto. Devuelve el producto creado, o null si falló.
  async function publicarProducto(datos: NuevoProducto): Promise<Producto | null> {
    const estado = datos.stock > 0 ? 'disponible' : 'agotado'
    const marca = datos.marca?.trim() || undefined
    // Reunimos las fotos: la galería nueva o, si no, la foto única del chat.
    const fotos =
      datos.imagenes && datos.imagenes.length > 0
        ? datos.imagenes
        : datos.imagen
          ? [datos.imagen]
          : []

    if (usarSupabase()) {
      // Subimos cada foto (dataURL) a Supabase Storage y guardamos sus URLs públicas;
      // las que ya sean URL o emoji se dejan tal cual.
      const imagenesFinal: string[] = []
      for (const foto of fotos) {
        if (foto.startsWith('data:')) {
          const url = await subirImagenProducto(foto)
          imagenesFinal.push(url || foto)
        } else {
          imagenesFinal.push(foto)
        }
      }
      const creado = await insertarProductoSupabase({
        nombre: datos.nombre,
        marca,
        modelo: datos.modelo?.trim() || undefined,
        material: datos.material?.trim() || undefined,
        descripcion: datos.descripcion,
        caracteristicas: datos.caracteristicas?.trim() || undefined,
        categoria: datos.categoria,
        precio: datos.precio,
        stock: datos.stock,
        estado,
        imagen: imagenesFinal[0] || '📦', // la 1ª foto es la principal (o un emoji)
        imagenes: imagenesFinal,
        idVendedor: datos.idVendedor,
        vendedorNombre: usuarioActual
          ? `${usuarioActual.nombre} ${usuarioActual.apellido}`.trim()
          : '',
      })
      if (creado) setProductos((prev) => [...prev, creado])
      return creado // null si la inserción falló
    }

    // Modo local: lógica pura reutilizable y testeable (id incremental en memoria).
    const producto = crearProductoLocal(productos, { ...datos, imagenes: fotos })
    setProductos((prev) => [...prev, producto])
    return producto
  }

  // Editor general: aplica cambios parciales. Si cambia el stock, recalcula el estado.
  function editarProducto(id: number, cambios: Partial<Producto>) {
    const conEstado: Partial<Producto> = { ...cambios }
    if (cambios.stock !== undefined) {
      conEstado.estado = cambios.stock > 0 ? 'disponible' : 'agotado'
    }
    // Con Supabase, persistimos en segundo plano (la UI se actualiza al instante).
    if (usarSupabase()) actualizarProductoSupabase(id, conEstado)
    setProductos((prev) => editarEnLista(prev, id, cambios))
  }

  // El vendedor cambia la foto de un producto ya publicado.
  async function actualizarImagen(id: number, imagen: string) {
    let img = imagen
    if (usarSupabase() && imagen.startsWith('data:')) {
      const url = await subirImagenProducto(imagen)
      if (url) img = url
    }
    editarProducto(id, { imagen: img })
  }

  // El vendedor (o una compra) actualiza el stock de un producto.
  function actualizarStock(id: number, nuevoStock: number) {
    editarProducto(id, { stock: nuevoStock })
  }

  // El vendedor elimina (da de baja) uno de sus productos del catálogo.
  function eliminarProducto(id: number) {
    if (usarSupabase()) eliminarProductoSupabase(id)
    setProductos((prev) => eliminarEnLista(prev, id))
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
