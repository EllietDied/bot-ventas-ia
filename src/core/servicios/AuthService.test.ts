import { describe, it, expect } from 'vitest'
import { iniciarSesion, validarRegistro, validarCorreo } from './AuthService'
import { Usuario } from '../modelos/Usuario'

function usuario(correo: string, contrasena: string): Usuario {
  return {
    idPersona: 'P1', nombre: 'Test', apellido: 'User', telefono: '', dni: '',
    idUsuario: 'U1', correo, contrasena,
    direccion: '', distrito: '', departamento: '',
    rol: 'comprador', estado: 'activo',
  }
}

const usuarios: Usuario[] = [usuario('demo@correo.com', '123456')]

describe('AuthService - inicio de sesión', () => {
  it('inicia sesión con credenciales correctas', () => {
    const u = iniciarSesion('demo@correo.com', '123456', usuarios)
    expect(u).not.toBeNull()
    expect(u?.correo).toBe('demo@correo.com')
  })

  it('rechaza credenciales incorrectas', () => {
    expect(iniciarSesion('demo@correo.com', 'malo', usuarios)).toBeNull()
    expect(iniciarSesion('noexiste@correo.com', '123456', usuarios)).toBeNull()
  })
})

describe('AuthService - validación de correo', () => {
  it('acepta correos con formato válido', () => {
    expect(validarCorreo('persona@ejemplo.com')).toBe(true)
  })
  it('rechaza correos con formato inválido', () => {
    expect(validarCorreo('persona')).toBe(false)
    expect(validarCorreo('persona@')).toBe(false)
    expect(validarCorreo('persona@ejemplo')).toBe(false)
  })
})

describe('AuthService - validación de registro', () => {
  const base = {
    nombre: 'Ana',
    apellido: 'Pérez',
    correo: 'ana@correo.com',
    contrasena: '123456',
    confirmar: '123456',
  }

  it('acepta un registro válido', () => {
    expect(validarRegistro(base, usuarios).ok).toBe(true)
  })
  it('rechaza nombre o apellido vacíos', () => {
    expect(validarRegistro({ ...base, nombre: '' }, usuarios).ok).toBe(false)
  })
  it('rechaza correo con formato inválido', () => {
    expect(validarRegistro({ ...base, correo: 'malo' }, usuarios).ok).toBe(false)
  })
  it('rechaza correo ya registrado', () => {
    expect(validarRegistro({ ...base, correo: 'demo@correo.com' }, usuarios).ok).toBe(false)
  })
  it('rechaza contraseña menor a 6 caracteres', () => {
    expect(validarRegistro({ ...base, contrasena: '123', confirmar: '123' }, usuarios).ok).toBe(
      false,
    )
  })
  it('rechaza cuando las contraseñas no coinciden', () => {
    expect(validarRegistro({ ...base, confirmar: 'otra' }, usuarios).ok).toBe(false)
  })
})
