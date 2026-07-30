import type { VercelRequest } from './_types.js'

const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPA_ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

export interface UsuarioAutenticado {
  id: string
  email?: string
}

// Verifica el JWT contra Supabase Auth. Las APIs con proveedores de pago (IA/visión)
// no deben quedar públicas porque una llamada anónima también consume saldo.
export async function autenticar(req: VercelRequest): Promise<UsuarioAutenticado | null> {
  if (!SUPA_URL || !SUPA_ANON) return null

  const authorization =
    typeof req.headers.authorization === 'string' ? req.headers.authorization : ''
  if (!authorization.startsWith('Bearer ')) return null

  const token = authorization.slice(7).trim()
  if (!token) return null

  const respuesta = await fetch(`${SUPA_URL}/auth/v1/user`, {
    headers: { apikey: SUPA_ANON, Authorization: `Bearer ${token}` },
  })
  if (!respuesta.ok) return null

  const usuario = await respuesta.json().catch(() => null)
  return usuario && typeof usuario.id === 'string'
    ? { id: usuario.id, email: typeof usuario.email === 'string' ? usuario.email : undefined }
    : null
}
