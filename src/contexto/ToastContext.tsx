import { createContext, useContext, useState, ReactNode } from 'react'

// Alertas visuales (toasts) para éxito / error / información.
// Es solo capa visual: no toca la lógica del proyecto.
type TipoToast = 'exito' | 'error' | 'info'

interface Toast {
  id: number
  tipo: TipoToast
  texto: string
}

// Funciones que cualquier componente puede usar para mostrar un toast.
interface ToastAPI {
  exito: (texto: string) => void
  error: (texto: string) => void
  info: (texto: string) => void
}

const ToastContext = createContext<ToastAPI | undefined>(undefined)

// Contador para un id único por toast (sin usar Date.now()).
let contadorToast = 0

// Icono según el tipo de alerta.
const ICONOS: Record<TipoToast, string> = {
  exito: '✅',
  error: '⚠️',
  info: '🤖',
}

// Proveedor que dibuja los toasts en una esquina de la pantalla.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  function mostrar(tipo: TipoToast, texto: string) {
    contadorToast += 1
    const id = contadorToast
    setToasts((prev) => [...prev, { id, tipo, texto }])
    // El toast se cierra solo después de 3 segundos.
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const api: ToastAPI = {
    exito: (texto) => mostrar('exito', texto),
    error: (texto) => mostrar('error', texto),
    info: (texto) => mostrar('info', texto),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-contenedor">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tipo}`}>
            <span className="toast-icono">{ICONOS[t.tipo]}</span>
            <span>{t.texto}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Hook para mostrar toasts desde cualquier pantalla.
export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
