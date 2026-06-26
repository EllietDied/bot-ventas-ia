// api/_supabase.ts
// Cliente de Supabase del lado del SERVIDOR para la API REST (carpeta api/).
// Los archivos que empiezan con "_" NO son endpoints: Vercel los ignora como ruta.
//
// Usa la "service role key" si está disponible (CRUD completo, sin pasar por RLS);
// si no, cae a la clave anónima (lecturas públicas; las escrituras dependen del
// RLS). La clave vive SOLO en variables de entorno del servidor, nunca en el
// frontend. Si no hay configuración, supabaseApi es null y cada endpoint responde
// 500 "no configurado".
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

export const supabaseApi: SupabaseClient | null =
  url && key ? createClient(url, key) : null

// Lee el cuerpo JSON de la petición (puede llegar como texto o ya parseado).
export function leerBody(body: unknown): Record<string, any> {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }
  return body as Record<string, any>
}

// Toma el parámetro ?id= (puede venir repetido) y lo convierte a entero (>0) o null.
export function leerId(valor: string | string[] | undefined): number | null {
  const crudo = Array.isArray(valor) ? valor[0] : valor
  const n = Number(crudo)
  return Number.isInteger(n) && n > 0 ? n : null
}
