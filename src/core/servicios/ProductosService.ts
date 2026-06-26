// Capa de datos de PRODUCTOS en Supabase (modo "real").
// Solo se usa cuando el interruptor está activado; si no, el contexto trabaja con
// localStorage. El mapeo traduce entre las columnas (snake_case) y el modelo Producto.
import { supabase } from '../datos/supabase'
import { Producto } from '../modelos/Producto'

// Una fila de la tabla "productos".
interface FilaProducto {
  id: number | string
  nombre: string | null
  marca: string | null
  descripcion: string | null
  categoria: string | null
  precio: number | string | null
  stock: number | string | null
  estado: string | null
  imagen: string | null
  id_vendedor: string | null
  vendedor_nombre: string | null
}

// Convierte una fila de Supabase al modelo Producto de la app.
export function mapProducto(fila: FilaProducto): Producto {
  return {
    id: Number(fila.id),
    nombre: fila.nombre ?? '',
    marca: fila.marca ?? undefined,
    descripcion: fila.descripcion ?? '',
    categoria: fila.categoria ?? '',
    precio: Number(fila.precio ?? 0),
    stock: Number(fila.stock ?? 0),
    estado: fila.estado ?? 'disponible',
    imagen: fila.imagen ?? '📦',
    idVendedor: fila.id_vendedor ?? undefined,
    vendedorNombre: fila.vendedor_nombre ?? undefined,
  }
}

// Lee todo el catálogo (ordenado por id).
export async function listarProductosSupabase(): Promise<Producto[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('id', { ascending: true })
  if (error || !data) return []
  return (data as FilaProducto[]).map(mapProducto)
}

// Inserta un producto y devuelve el creado (con su id real de la base).
export async function insertarProductoSupabase(p: {
  nombre: string
  marca?: string
  descripcion: string
  categoria: string
  precio: number
  stock: number
  estado: string
  imagen: string
  idVendedor: string
  vendedorNombre: string
}): Promise<Producto | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('productos')
    .insert({
      nombre: p.nombre,
      marca: p.marca ?? null,
      descripcion: p.descripcion,
      categoria: p.categoria,
      precio: p.precio,
      stock: p.stock,
      estado: p.estado,
      imagen: p.imagen,
      id_vendedor: p.idVendedor,
      vendedor_nombre: p.vendedorNombre,
    })
    .select()
    .single()
  if (error || !data) return null
  return mapProducto(data as FilaProducto)
}

// Aplica cambios a un producto (solo las columnas que vienen).
export async function actualizarProductoSupabase(
  id: number,
  cambios: Partial<Producto>,
): Promise<void> {
  if (!supabase) return
  const fila: Record<string, string | number | null> = {}
  if (cambios.nombre !== undefined) fila.nombre = cambios.nombre
  if (cambios.marca !== undefined) fila.marca = cambios.marca || null
  if (cambios.descripcion !== undefined) fila.descripcion = cambios.descripcion
  if (cambios.categoria !== undefined) fila.categoria = cambios.categoria
  if (cambios.precio !== undefined) fila.precio = cambios.precio
  if (cambios.stock !== undefined) fila.stock = cambios.stock
  if (cambios.estado !== undefined) fila.estado = cambios.estado
  if (cambios.imagen !== undefined) fila.imagen = cambios.imagen
  if (Object.keys(fila).length === 0) return
  await supabase.from('productos').update(fila).eq('id', id)
}

// Elimina un producto.
export async function eliminarProductoSupabase(id: number): Promise<void> {
  if (!supabase) return
  await supabase.from('productos').delete().eq('id', id)
}

// Sube una foto (dataURL) al bucket "productos" de Supabase Storage y devuelve su
// URL pública. Si no hay Supabase o no es una imagen subida, devuelve null y el
// llamador conserva el valor original (emoji o dataURL en modo local).
export async function subirImagenProducto(dataUrl: string): Promise<string | null> {
  if (!supabase || !dataUrl.startsWith('data:')) return null
  try {
    const blob = await (await fetch(dataUrl)).blob()
    const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
    const ruta = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage
      .from('productos')
      .upload(ruta, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
    if (error) return null
    return supabase.storage.from('productos').getPublicUrl(ruta).data.publicUrl
  } catch {
    return null
  }
}
