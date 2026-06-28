// PagosService.ts
// Cliente del frontend para la pasarela de pagos (Culqi), a través de la función
// serverless /api/pago-crear (la llave secreta vive en el servidor, nunca aquí).
// Si VITE_USAR_PAGOS_REALES no está en 'true', la app usa el modo simulado.

// ¿Está activado el cobro real con la pasarela?
export function usarPagosReales(): boolean {
  return import.meta.env.VITE_USAR_PAGOS_REALES === 'true'
}

// Datos del cliente que la orden necesita (nada sensible).
export interface ClientePago {
  nombre?: string
  apellido?: string
  email?: string
  telefono?: string
}

// Respuesta de un pago por PagoEfectivo (código CIP + QR + link).
export interface PagoEfectivo {
  tipo: 'pagoefectivo'
  orderId: string
  cip: string
  qr: string
  url: string
  monto: number
  expira: number
}

// Pide al servidor generar un pago por PagoEfectivo (devuelve el CIP para pagar).
export async function crearPagoEfectivo(datos: {
  monto: number
  concepto: 'recarga' | 'compra'
  usuarioId: string
  cliente: ClientePago
}): Promise<PagoEfectivo> {
  const respuesta = await fetch('/api/pago-crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metodo: 'pagoefectivo', ...datos }),
  })
  if (!respuesta.ok) throw new Error('No se pudo generar el código de pago.')
  const d = await respuesta.json()
  if (!d || typeof d.cip !== 'string') throw new Error('La respuesta del pago no es válida.')
  return d as PagoEfectivo
}
