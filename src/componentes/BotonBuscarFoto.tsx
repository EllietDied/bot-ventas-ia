import { useEffect, useRef, useState } from 'react'
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

// Botón "Buscar por foto": abre un menú con dos opciones —elegir una foto de la
// galería o tomarla con la cámara—. La IA identifica el producto (MobileNet en el
// navegador, o la nube) y devuelve los productos del catálogo similares.
export function BotonBuscarFoto({ onResultado, onInicio, className }: Props) {
  const { productos } = useProductos()
  const [analizando, setAnalizando] = useState(false)
  const [menu, setMenu] = useState(false)
  const inputGaleria = useRef<HTMLInputElement>(null)
  const inputCamara = useRef<HTMLInputElement>(null)

  // Cierra el menú al hacer clic fuera de él.
  useEffect(() => {
    if (!menu) return
    const cerrar = () => setMenu(false)
    document.addEventListener('click', cerrar)
    return () => document.removeEventListener('click', cerrar)
  }, [menu])

  async function alElegir(file: File) {
    let dataURL = ''
    try {
      dataURL = await comprimirImagen(file)
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
        onClick={(e) => {
          e.stopPropagation() // evita que el mismo clic cierre el menú al abrirlo
          setMenu((m) => !m)
        }}
      >
        <Icono nombre="camara" size={15} /> {analizando ? 'Analizando…' : 'Buscar por foto'}
      </button>

      {menu && (
        <div className="foto-menu">
          <button
            type="button"
            className="foto-menu-item"
            onClick={() => {
              setMenu(false)
              inputGaleria.current?.click()
            }}
          >
            🖼️ Seleccionar de mi galería
          </button>
          <button
            type="button"
            className="foto-menu-item"
            onClick={() => {
              setMenu(false)
              inputCamara.current?.click()
            }}
          >
            📷 Tomar una foto con la cámara
          </button>
        </div>
      )}

      {/* Galería: selector de archivos normal */}
      <input
        ref={inputGaleria}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) alElegir(file)
          e.currentTarget.value = ''
        }}
      />
      {/* Cámara: en el celular abre directo la cámara trasera */}
      <input
        ref={inputCamara}
        type="file"
        accept="image/*"
        capture="environment"
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
