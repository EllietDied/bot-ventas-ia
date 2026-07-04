// Una dirección de envío guardada por el cliente (puede tener hasta 3).
export interface Direccion {
  id: string // id local ("dir-...") o el id de la fila en Supabase (como texto)
  receptor: string // quién recibe el pedido
  telefono: string
  direccion: string
  referencia?: string // indicaciones para llegar (opcional)
  // Datos para un envío más seguro y confiable:
  dni?: string // documento de quien recibe (verificación al entregar)
  departamento?: string // departamento / región
  provincia?: string
  distrito?: string
  correo?: string // avisos y seguimiento del envío
}
