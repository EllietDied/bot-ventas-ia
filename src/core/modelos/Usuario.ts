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
  // Datos internacionales del registro (opcionales, por compatibilidad con cuentas previas).
  paisCodigo?: string // ISO del país (PE, CL...)
  paisNombre?: string
  prefijoTelefonico?: string // +51, +56...
  telefonoInternacional?: string // prefijo + número nacional
  tipoDocumento?: string // DNI, CEDULA, RUN, CPF...
  documentoDisplay?: string // documento con su formato visual
  documentoComplemento?: string // Bolivia
  // Dirección territorial estructurada (Fase 2). Códigos como texto (conservan ceros).
  codigoPostal?: string
  nivel1Tipo?: string // department, region, state...
  nivel1Codigo?: string
  nivel1Nombre?: string
  nivel2Tipo?: string
  nivel2Codigo?: string
  nivel2Nombre?: string
  nivel3Tipo?: string
  nivel3Codigo?: string
  nivel3Nombre?: string
}
