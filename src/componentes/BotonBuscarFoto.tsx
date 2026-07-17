import { useRef, useState } from 'react'
import { useProductos } from '../contexto/ProductosContext'
import { comprimirImagen } from '../util/imagen'
import { buscarPorFoto, type ResultadoBusquedaVisual } from '../core/servicios/BusquedaVisualService'
import { Icono } from './Icono'

interface Props {
  // Se llama con el resultado de identificar la foto y filtrar el catálogo.
  onResultado: (r: ResultadoBusquedaVisual) => void
  // Se llama al EMPEZAR a analizar, con la foto (dataURL) para mostrarla en el chat.
  onInicio?: (dataURL: string) => void
  // Clase del botón (para reusarlo con distintos estilos: chip, btn, etc.).
  className?: string
}

// Botón "Buscar por foto": abre el selector de imágenes del sistema.
// En el celular, el propio sistema ofrece "Cámara / Galería / Archivos"; en la PC,
// abre el explorador de archivos. (Antes usábamos un menú propio, pero el overflow
// del contenedor lo recortaba en móvil; el selector nativo es más simple y robusto.)
export function BotonBuscarFoto({ onResultado, onInicio, className }: Props) {
  const { productos } = useProductos()
  const [analizando, setAnalizando] = useState(false)
  const inputFoto = useRef<HTMLInputElement>(null)

  async function alElegir(file: File) {
    let dataURL = ''
    try {
      // Comprimimos a 768px (más que el resto): así la IA puede LEER el texto de las
      // cajas de productos (marca, modelo, "DDR5"...) y no solo ver la forma.
      dataURL = await comprimirImagen(file, 768)
    } catch {
      /* si falla la compresión, la búsqueda caerá al aviso de abajo */
    }
    onInicio?.(dataURL) // muestra la foto y el "analizando…" en el chat
    setAnalizando(true)
    try {
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
    <span className="foto-wrap">
      <button
        type="button"
        className={className ?? 'chip'}
        disabled={analizando}
        onClick={() => inputFoto.current?.click()}
      >
        <Icono nombre="camara" size={15} /> {analizando ? 'Analizando…' : 'Buscar por foto'}
      </button>

      {/* Un solo selector: en el celular el sistema ofrece Cámara o Galería. */}
      <input
        ref={inputFoto}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) alElegir(file)
          e.currentTarget.value = ''
        }}
      />
    </span>
  )
}
