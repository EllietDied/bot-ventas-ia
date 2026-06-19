/// <reference types="vite/client" />

// Variables de entorno del frontend (las que empiezan con VITE_).
interface ImportMetaEnv {
  // Interruptor del modo del asistente: 'true' usa la IA real, cualquier otro valor usa el modo simulado.
  readonly VITE_USAR_IA_REAL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
