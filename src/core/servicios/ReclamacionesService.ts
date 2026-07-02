// ReclamacionesService.ts
// Guarda una hoja del Libro de Reclamaciones (INDECOPI). En modo Supabase la escribe
// en la tabla `reclamaciones`; en modo local (sin conexión) la guarda en el navegador.
// Devuelve un CÓDIGO que se le entrega al consumidor como constancia.
import { supabase, usarSupabase } from '../datos/supabase'
import { guardar, cargar } from '../datos/almacenamiento'

// Datos de una hoja de reclamación (lo que llena el consumidor).
export interface Reclamacion {
  tipo: 'reclamo' | 'queja' // reclamo = disconformidad con el bien; queja = malestar por la atención
  consumidorNombre: string
  consumidorDocumento?: string
  consumidorTelefono?: string
  consumidorCorreo?: string
  consumidorDomicilio?: string
  esMenor?: boolean
  tipoBien?: 'producto' | 'servicio'
  montoReclamado?: number
  descripcionBien?: string
  detalle: string
  pedidoConsumidor?: string
}

// Genera un código legible para la constancia (p. ej. "REC-LZ4K9A").
function generarCodigo(): string {
  return 'REC-' + Date.now().toString(36).toUpperCase().slice(-6)
}

// Registra la reclamación y devuelve su código de constancia.
export async function enviarReclamacion(r: Reclamacion): Promise<{ codigo: string }> {
  const codigo = generarCodigo()

  if (usarSupabase() && supabase) {
    const { error } = await supabase.from('reclamaciones').insert({
      codigo,
      tipo: r.tipo,
      consumidor_nombre: r.consumidorNombre,
      consumidor_documento: r.consumidorDocumento ?? null,
      consumidor_telefono: r.consumidorTelefono ?? null,
      consumidor_correo: r.consumidorCorreo ?? null,
      consumidor_domicilio: r.consumidorDomicilio ?? null,
      es_menor: r.esMenor ?? false,
      tipo_bien: r.tipoBien ?? null,
      monto_reclamado: r.montoReclamado ?? null,
      descripcion_bien: r.descripcionBien ?? null,
      detalle: r.detalle,
      pedido_consumidor: r.pedidoConsumidor ?? null,
    })
    if (error) throw new Error('No se pudo registrar la reclamación.')
  } else {
    // Modo local: se guarda en el navegador (clave "reclamaciones").
    const lista = cargar<any[]>('reclamaciones', [])
    lista.push({ codigo, ...r, creado_en: new Date().toISOString() })
    guardar('reclamaciones', lista)
  }

  return { codigo }
}
