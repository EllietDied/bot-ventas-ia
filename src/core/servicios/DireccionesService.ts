// DireccionesService.ts
// Libreta de direcciones del cliente (hasta 3). En modo Supabase se guardan en la
// tabla `direcciones`; en modo local, en localStorage. Cada quien gestiona SOLO las
// suyas (lo garantiza el RLS en Supabase).
import { supabase, usarSupabase } from '../datos/supabase'
import { cargar, guardar } from '../datos/almacenamiento'
import { Direccion } from '../modelos/Direccion'

export const MAX_DIRECCIONES = 3

// Clave de localStorage por usuario (modo local).
function clave(idUsuario: string): string {
  return 'direcciones_' + idUsuario
}

// Traduce una fila de la base al modelo.
function mapFila(d: any): Direccion {
  return {
    id: String(d.id),
    receptor: d.receptor ?? '',
    telefono: d.telefono ?? '',
    direccion: d.direccion ?? '',
    referencia: d.referencia ?? '',
    dni: d.dni ?? '',
    departamento: d.departamento ?? '',
    provincia: d.provincia ?? '',
    distrito: d.distrito ?? '',
    correo: d.correo ?? '',
  }
}

// Lista las direcciones guardadas del usuario.
export async function listarDirecciones(idUsuario: string): Promise<Direccion[]> {
  if (usarSupabase() && supabase) {
    const { data } = await supabase
      .from('direcciones')
      .select('*')
      .order('creado_en', { ascending: true })
    return (data ?? []).map(mapFila)
  }
  return cargar<Direccion[]>(clave(idUsuario), [])
}

// Resultado de agregar: distinguimos "llegó al límite" de "falló el guardado",
// para poder mostrar un mensaje honesto (no siempre "máximo 3").
export type ResultadoAgregar =
  | { ok: true; direccion: Direccion }
  | { ok: false; motivo: 'limite' | 'error' }

// Agrega una dirección (respeta el máximo de 3).
export async function agregarDireccion(
  idUsuario: string,
  dir: Omit<Direccion, 'id'>,
): Promise<ResultadoAgregar> {
  const actuales = await listarDirecciones(idUsuario)
  if (actuales.length >= MAX_DIRECCIONES) return { ok: false, motivo: 'limite' }

  if (usarSupabase() && supabase) {
    const { data: sesion } = await supabase.auth.getSession()
    const uid = sesion.session?.user?.id
    if (!uid) return { ok: false, motivo: 'error' }
    const { data, error } = await supabase
      .from('direcciones')
      .insert({
        usuario_id: uid,
        receptor: dir.receptor,
        telefono: dir.telefono,
        direccion: dir.direccion,
        referencia: dir.referencia ?? null,
        dni: dir.dni ?? null,
        departamento: dir.departamento ?? null,
        provincia: dir.provincia ?? null,
        distrito: dir.distrito ?? null,
        correo: dir.correo ?? null,
      })
      .select()
      .single()
    if (error || !data) {
      // El detalle real (p. ej. "column ... does not exist") ayuda a diagnosticar.
      console.error('No se pudo guardar la dirección:', error)
      return { ok: false, motivo: 'error' }
    }
    return { ok: true, direccion: mapFila(data) }
  }

  const nueva: Direccion = { id: 'dir-' + Date.now(), ...dir }
  guardar(clave(idUsuario), [...actuales, nueva])
  return { ok: true, direccion: nueva }
}

// Elimina una dirección guardada.
export async function eliminarDireccion(idUsuario: string, id: string): Promise<void> {
  if (usarSupabase() && supabase) {
    await supabase.from('direcciones').delete().eq('id', Number(id))
    return
  }
  const actuales = await listarDirecciones(idUsuario)
  guardar(
    clave(idUsuario),
    actuales.filter((d) => d.id !== id),
  )
}
