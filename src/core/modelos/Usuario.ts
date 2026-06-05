import { Persona } from './Persona'

// Rol que se elige al registrarse.
export type Rol = 'comprador' | 'vendedor'

// Usuario HEREDA de Persona (relación de herencia del UML).
// 'extends' representa esa herencia en TypeScript.
export interface Usuario extends Persona {
  idUsuario: string
  correo: string
  contrasena: string
  direccion: string
  distrito: string
  departamento: string
  rol: Rol
  estado: string // 'activo' | 'inactivo'
}
