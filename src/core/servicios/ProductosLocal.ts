// Lógica PURA del CRUD de productos en modo local (sin React, sin Supabase).
// Se usa desde ProductosContext (modo localStorage) y es fácil de probar con Vitest.
import { Producto } from '../modelos/Producto'

// Datos del formulario para crear un producto.
export interface DatosProducto {
  nombre: string
  marca?: string
  descripcion: string
  categoria: string
  precio: number
  stock: number
  idVendedor: string
  imagen?: string
}

// Valida los datos mínimos de un producto (RA3).
// Devuelve el primer mensaje de error, o null si todo está correcto.
export function validarProducto(d: Partial<DatosProducto>): string | null {
  if (!d.nombre || d.nombre.trim() === '') return 'El nombre del producto es obligatorio.'
  if (!d.categoria || d.categoria.trim() === '') return 'La categoría es obligatoria.'
  const precio = Number(d.precio)
  if (!Number.isFinite(precio) || precio <= 0) return 'El precio debe ser mayor a cero.'
  const stock = Number(d.stock)
  if (!Number.isInteger(stock) || stock < 0) return 'El stock no puede ser negativo.'
  return null
}

// Siguiente id incremental para el modo local.
export function siguienteId(productos: Producto[]): number {
  return productos.reduce((max, p) => Math.max(max, p.id), 0) + 1
}

// Crea un producto nuevo (modo local). Conviene validar antes con validarProducto.
export function crearProductoLocal(productos: Producto[], d: DatosProducto): Producto {
  return {
    id: siguienteId(productos),
    nombre: d.nombre.trim(),
    marca: d.marca?.trim() || undefined,
    descripcion: d.descripcion,
    categoria: d.categoria,
    precio: d.precio,
    stock: d.stock,
    estado: d.stock > 0 ? 'disponible' : 'agotado',
    imagen: d.imagen || '📦',
    idVendedor: d.idVendedor,
  }
}

// Aplica cambios a un producto; si cambió el stock, recalcula el estado.
export function aplicarCambios(producto: Producto, cambios: Partial<Producto>): Producto {
  const actualizado = { ...producto, ...cambios }
  if (cambios.stock !== undefined) {
    actualizado.estado = cambios.stock > 0 ? 'disponible' : 'agotado'
  }
  return actualizado
}

// Edita un producto dentro de la lista (devuelve una lista nueva).
export function editarEnLista(productos: Producto[], id: number, cambios: Partial<Producto>): Producto[] {
  return productos.map((p) => (p.id === id ? aplicarCambios(p, cambios) : p))
}

// Elimina un producto de la lista (devuelve una lista nueva).
export function eliminarEnLista(productos: Producto[], id: number): Producto[] {
  return productos.filter((p) => p.id !== id)
}
