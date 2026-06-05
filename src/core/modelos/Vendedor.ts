import { Usuario } from './Usuario'

// Vendedor HEREDA de Usuario. Añade su reputación (opcional).
export interface Vendedor extends Usuario {
  rol: 'vendedor'
  reputacion?: number
}

// Función ayudante: indica si un usuario es vendedor.
export function esVendedor(usuario: Usuario): usuario is Vendedor {
  return usuario.rol === 'vendedor'
}
