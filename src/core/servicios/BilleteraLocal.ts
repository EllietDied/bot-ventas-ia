// BilleteraLocal.ts
// Billetera en modo LOCAL (localStorage): saldo y movimientos por usuario.
// Lógica PURA + persistencia simple, fácil de probar con Vitest.
// (En modo real, el saldo lo acreditará el servidor vía webhook; esto es el
//  respaldo local/simulado, igual que el resto de la app.)
import { cargar, guardar } from '../datos/almacenamiento'

export interface MovimientoBilletera {
  id: string
  tipo: 'recarga' | 'compra'
  monto: number // en soles, siempre positivo
  fecha: string // ISO
  detalle: string
  metodo?: string // 'pagoefectivo' | 'tarjeta' | 'simulado' | 'saldo'
}

export interface EstadoBilletera {
  saldo: number
  movimientos: MovimientoBilletera[]
}

export const BILLETERA_VACIA: EstadoBilletera = { saldo: 0, movimientos: [] }

// Redondea a 2 decimales (evita errores de coma flotante con dinero).
function redondear(n: number): number {
  return Math.round(n * 100) / 100
}

// Clave de almacenamiento por usuario (no mezclar billeteras).
function clave(usuarioId: string): string {
  return 'billetera_' + usuarioId
}

export function cargarBilletera(usuarioId: string): EstadoBilletera {
  return cargar<EstadoBilletera>(clave(usuarioId), BILLETERA_VACIA)
}

export function guardarBilletera(usuarioId: string, estado: EstadoBilletera): void {
  guardar(clave(usuarioId), estado)
}

// PURA: agrega una recarga y devuelve un estado NUEVO (no muta el anterior).
export function aplicarRecarga(
  estado: EstadoBilletera,
  monto: number,
  metodo: string,
  id: string,
  fecha: string,
): EstadoBilletera {
  const mov: MovimientoBilletera = {
    id,
    tipo: 'recarga',
    monto: redondear(monto),
    fecha,
    detalle: 'Recarga de billetera',
    metodo,
  }
  return { saldo: redondear(estado.saldo + monto), movimientos: [mov, ...estado.movimientos] }
}

// PURA: descuenta una compra del saldo. Lanza si no alcanza (control atómico simple).
export function aplicarCompra(
  estado: EstadoBilletera,
  monto: number,
  detalle: string,
  id: string,
  fecha: string,
): EstadoBilletera {
  if (monto > estado.saldo) throw new Error('Saldo insuficiente.')
  const mov: MovimientoBilletera = {
    id,
    tipo: 'compra',
    monto: redondear(monto),
    fecha,
    detalle,
    metodo: 'saldo',
  }
  return { saldo: redondear(estado.saldo - monto), movimientos: [mov, ...estado.movimientos] }
}
