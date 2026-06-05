import { useEffect, useState } from 'react'

// El evento 'beforeinstallprompt' no está en los tipos estándar del navegador,
// así que describimos lo que necesitamos de él.
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Botón "Instalar aplicación".
// Solo aparece cuando el navegador permite instalar la PWA.
export function BotonInstalar() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null)

  useEffect(() => {
    // El navegador avisa que la app se puede instalar.
    function alPoderInstalar(e: Event) {
      e.preventDefault() // evitamos el aviso automático para usar nuestro botón
      setEvento(e as EventoInstalacion)
    }
    // Cuando ya se instaló, ocultamos el botón.
    function alInstalar() {
      setEvento(null)
    }

    window.addEventListener('beforeinstallprompt', alPoderInstalar)
    window.addEventListener('appinstalled', alInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  // Si el navegador no ofrece instalar, no mostramos nada.
  if (!evento) return null

  async function instalar() {
    if (!evento) return
    await evento.prompt() // muestra el cuadro de instalación del navegador
    await evento.userChoice
    setEvento(null)
  }

  return (
    <button className="btn btn-primario btn-pequeno" onClick={instalar}>
      ⬇️ Instalar aplicación
    </button>
  )
}
