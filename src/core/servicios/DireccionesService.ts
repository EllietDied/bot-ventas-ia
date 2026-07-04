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

// Agrega una dirección (respeta el máximo de 3). Devuelve la creada, o null si ya
// llegó al límite o falló.
export async function agregarDireccion(
  idUsuario: string,
  dir: Omit<Direccion, 'id'>,
): Promise<Direccion | null> {
  const actuales = await listarDirecciones(idUsuario)
  if (actuales.length >= MAX_DIRECCIONES) return null

  if (usarSupabase() && supabase) {
    const { data: sesion } = await supabase.auth.getSession()
    const uid = sesion.session?.user?.id
    if (!uid) return null
    const { data, error } = await supabase
      .from('direcciones')
      .insert({
        usuario_id: uid,
        receptor: dir.receptor,
        telefono: dir.telefono,
        direccion: dir.direccion,
        referencia: dir.referencia ?? null,
      })
      .select()
      .single()
    if (error || !data) return null
    return mapFila(data)
  }

  const nueva: Direccion = { id: 'dir-' + Date.now(), ...dir }
  guardar(clave(idUsuario), [...actuales, nueva])
  return nueva
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
