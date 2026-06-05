import { Usuario } from './Usuario'

// Comprador HEREDA de Usuario (que a su vez hereda de Persona).
// Solo fija el rol en 'comprador'.
export interface Comprador extends Usuario {
  rol: 'comprador'
}

// Función ayudante: indica si un usuario es comprador.
// Sirve para que TypeScript "estreche" el tipo a Comprador.
export function esComprador(usuario: Usuario): usuario is Comprador {
  return usuario.rol === 'comprador'
}
