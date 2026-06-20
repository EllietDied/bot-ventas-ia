// Capa de datos de CONSULTAS en Supabase (modo "real").
// Las consultas son por usuario; el RLS solo deja ver/gestionar las propias.
// La Pila LIFO se reconstruye en el contexto a partir de esta lista.
import { supabase } from '../datos/supabase'
import { Consulta } from '../estructuras/PilaConsultas'

interface FilaConsulta {
  termino: string | null
  categoria: string | null
  creado_en: string | null
}

// Lista las consultas del usuario, de la más antigua a la más reciente
// (así el contexto las apila y la Pila las muestra en orden LIFO).
export async function listarConsultasSupabase(usuarioId: string): Promise<Consulta[]> {
  if (!supabase || !usuarioId) return []
  const { data, error } = await supabase
    .from('consultas')
    .select('termino, categoria, creado_en')
    .eq('usuario_id', usuarioId)
    .order('creado_en', { ascending: true })
  if (error || !data) return []
  return (data as FilaConsulta[]).map((f) => ({
    termino: f.termino ?? '',
    categoria: f.categoria ?? '',
    fechaHora: f.creado_en ? new Date(f.creado_en).toLocaleString() : '',
  }))
}

// Registra una consulta.
export async function insertarConsultaSupabase(
  usuarioId: string,
  termino: string,
  categoria: string,
): Promise<void> {
  if (!supabase || !usuarioId) return
  await supabase.from('consultas').insert({ usuario_id: usuarioId, termino, categoria })
}

// Borra todas las consultas del usuario.
export async function limpiarConsultasSupabase(usuarioId: string): Promise<void> {
  if (!supabase || !usuarioId) return
  await supabase.from('consultas').delete().eq('usuario_id', usuarioId)
}
