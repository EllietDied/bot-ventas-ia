// api/_supabase.ts
// Helpers del lado del SERVIDOR para la API REST (carpeta api/).
// Los archivos que empiezan con "_" NO son endpoints: Vercel los ignora como ruta.
//
// IMPORTANTE: hablamos con Supabase por su API REST (PostgREST) vía fetch NATIVO,
// SIN el SDK @supabase/supabase-js, porque ese paquete hace FALLAR las funciones
// serverless de Vercel (FUNCTION_INVOCATION_FAILED) al cargar el módulo. fetch es
// nativo y robusto (es el mismo patrón que usa api/pago-webhook.ts).
//
// Usa la "service role key" si está (CRUD completo, salta RLS); si no, cae a la
// clave anónima (lecturas públicas). La clave vive SOLO en variables de entorno
// del servidor, nunca en el frontend.

const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPA_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

// ¿Hay configuración para hablar con la base? (antes era "supabaseApi !== null").
export const supabaseConfigurado: boolean = !!(SUPA_URL && SUPA_KEY)

// Llamada cruda a la API REST de Supabase (PostgREST).
function supa(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPA_KEY,
      Authorization: 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

// Llama a la base y devuelve { ok, status, datos } con el JSON ya parseado.
// Es el único helper que usan los endpoints para leer/escribir.
export async function pedir(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; datos: any }> {
  const r = await supa(path, init)
  const txt = await r.text().catch(() => '')
  let datos: any = null
  if (txt) {
    try {
      datos = JSON.parse(txt)
    } catch {
      datos = null
    }
  }
  return { ok: r.ok, status: r.status, datos }
}

// Cabecera para que PostgREST DEVUELVA el registro afectado en POST/PATCH/DELETE.
export const RETORNAR = { Prefer: 'return=representation' }

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
