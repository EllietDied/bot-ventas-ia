// Persistencia de la conversación del asistente en Supabase (modo "real"),
// para que el historial del chat se sincronice entre dispositivos. En modo local
// el historial vive en localStorage (lo maneja el componente Asistente).
import { supabase } from '../datos/supabase'

// Carga la conversación guardada del usuario (por tipo de chat). null si no hay.
export async function cargarChatSupabase(
  usuarioId: string,
  rol: string,
): Promise<Record<string, unknown>[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('chats_asistente')
    .select('mensajes')
    .eq('usuario_id', usuarioId)
    .eq('rol', rol)
    .maybeSingle()
  if (error || !data) return null
  return Array.isArray(data.mensajes) ? (data.mensajes as Record<string, unknown>[]) : null
}

// Guarda (upsert) la conversación del usuario.
export async function guardarChatSupabase(
  usuarioId: string,
  rol: string,
  mensajes: unknown[],
): Promise<void> {
  if (!supabase) return
  await supabase.from('chats_asistente').upsert(
    { usuario_id: usuarioId, rol, mensajes, actualizado_en: new Date().toISOString() },
    { onConflict: 'usuario_id,rol' },
  )
}
