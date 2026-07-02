import { useRef, useState } from 'react'
import { useProductos } from '../contexto/ProductosContext'
import { comprimirImagen } from '../util/imagen'
import { buscarPorFoto, type ResultadoBusquedaVisual } from '../core/servicios/BusquedaVisualService'
import { Icono } from './Icono'

interface Props {
  // Se llama con el resultado de identificar la foto y filtrar el catálogo.
  onResultado: (r: ResultadoBusquedaVisual) => void
  // Clase del botón (para reusarlo con distintos estilos: chip, btn, etc.).
  className?: string
}

// Botón reutilizable "Buscar por foto": el cliente toma/sube una foto, la IA la
// identifica (en el navegador con MobileNet, o en la nube) y devuelve los productos
// del catálogo iguales o similares. Se usa en el catálogo y en el chat del asistente.
export function BotonBuscarFoto({ onResultado, className }: Props) {
  const { productos } = useProductos()
  const [analizando, setAnalizando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function alElegir(file: File) {
    setAnalizando(true)
    try {
      const dataURL = await comprimirImagen(file)
      const resultado = await buscarPorFoto(dataURL, productos)
      onResultado(resultado)
    } catch {
      // Si algo falla, devolvemos un resultado vacío (el padre muestra el aviso).
      onResultado({ termino: '', etiqueta: '', productos: [], fuente: 'manual', necesitaCategoria: true })
    } finally {
      setAnalizando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={className ?? 'chip'}
        disabled={analizando}
        onClick={() => inputRef.current?.click()}
      >
        <Icono nombre="camara" size={15} /> {analizando ? 'Analizando…' : 'Buscar por foto'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) alElegir(file)
          e.currentTarget.value = ''
        }}
      />
    </>
  )
}
