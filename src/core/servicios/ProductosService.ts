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
  modelo: string | null
  material: string | null
  descripcion: string | null
  caracteristicas: string | null
  categoria: string | null
  precio: number | string | null
  stock: number | string | null
  estado: string | null
  imagen: string | null
  imagenes: unknown // jsonb: lista de URLs de la galería
  id_vendedor: string | null
  vendedor_nombre: string | null
}

// Convierte una fila de Supabase al modelo Producto de la app.
export function mapProducto(fila: FilaProducto): Producto {
  // La galería viene como jsonb (ya es un arreglo); nos aseguramos de que sean textos.
  const imagenes = Array.isArray(fila.imagenes)
    ? (fila.imagenes as unknown[]).map((x) => String(x)).filter(Boolean)
    : []
  return {
    id: Number(fila.id),
    nombre: fila.nombre ?? '',
    marca: fila.marca ?? undefined,
    modelo: fila.modelo ?? undefined,
    material: fila.material ?? undefined,
    descripcion: fila.descripcion ?? '',
    caracteristicas: fila.caracteristicas ?? undefined,
    categoria: fila.categoria ?? '',
    precio: Number(fila.precio ?? 0),
    stock: Number(fila.stock ?? 0),
    estado: fila.estado ?? 'disponible',
    imagen: fila.imagen ?? '📦',
    imagenes,
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
  modelo?: string
  material?: string
  descripcion: string
  caracteristicas?: string
  categoria: string
  precio: number
  stock: number
  estado: string
  imagen: string
  imagenes?: string[]
  idVendedor: string
  vendedorNombre: string
}): Promise<Producto | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('productos')
    .insert({
      nombre: p.nombre,
      marca: p.marca ?? null,
      modelo: p.modelo ?? null,
      material: p.material ?? null,
      descripcion: p.descripcion,
      caracteristicas: p.caracteristicas ?? null,
      categoria: p.categoria,
      precio: p.precio,
      stock: p.stock,
      estado: p.estado,
      imagen: p.imagen,
      imagenes: p.imagenes ?? [],
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
  const fila: Record<string, string | number | null | string[]> = {}
  if (cambios.nombre !== undefined) fila.nombre = cambios.nombre
  if (cambios.marca !== undefined) fila.marca = cambios.marca || null
  if (cambios.modelo !== undefined) fila.modelo = cambios.modelo || null
  if (cambios.material !== undefined) fila.material = cambios.material || null
  if (cambios.descripcion !== undefined) fila.descripcion = cambios.descripcion
  if (cambios.caracteristicas !== undefined) fila.caracteristicas = cambios.caracteristicas || null
  if (cambios.categoria !== undefined) fila.categoria = cambios.categoria
  if (cambios.precio !== undefined) fila.precio = cambios.precio
  if (cambios.stock !== undefined) fila.stock = cambios.stock
  if (cambios.estado !== undefined) fila.estado = cambios.estado
  if (cambios.imagen !== undefined) fila.imagen = cambios.imagen
  if (cambios.imagenes !== undefined) fila.imagenes = cambios.imagenes
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
