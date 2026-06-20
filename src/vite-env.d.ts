/// <reference types="vite/client" />

// Variables de entorno del frontend (las que empiezan con VITE_).
interface ImportMetaEnv {
  // Interruptor del modo del asistente: 'true' usa la IA real, cualquier otro valor usa el modo simulado.
  readonly VITE_USAR_IA_REAL?: string
  // Interruptor de Supabase: 'true' usa la base de datos / autenticación real.
  readonly VITE_USAR_SUPABASE?: string
  // Conexión a Supabase (públicas; lo que protege los datos es RLS, no esconder estas claves).
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
