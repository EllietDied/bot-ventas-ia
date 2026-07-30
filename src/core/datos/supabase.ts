import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Conexión a Supabase. Estas claves son PÚBLICAS (van en el frontend); lo que
// protege los datos es la seguridad por filas (RLS) en la base, no esconderlas.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cliente de Supabase. Es null mientras no esté configurado: así la app sigue
// funcionando con localStorage y nada se rompe si aún no creaste el proyecto.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

// ¿Usamos Supabase para la autenticación? Solo si está ACTIVADO el interruptor
// Y el cliente está configurado. En cualquier otro caso, se usa el modo local.
export function usarSupabase(): boolean {
  return import.meta.env.VITE_USAR_SUPABASE === 'true' && supabase !== null
}

// Token para llamar a funciones serverless protegidas. No refrescamos nada a mano:
// getSession usa el mecanismo de sesión del cliente de Supabase.
export async function tokenSesionSupabase(): Promise<string> {
  if (!supabase) return ''
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}
