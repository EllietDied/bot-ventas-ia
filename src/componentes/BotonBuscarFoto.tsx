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

// Botón "Buscar por foto": abre un modal con dos opciones —tomar una foto con la
// cámara o elegir de la galería—. El modal va a PANTALLA COMPLETA (position: fixed),
// así no lo recorta ningún contenedor. En Android/iOS "Cámara" abre la cámara directa.
export function BotonBuscarFoto({ onResultado, onInicio, className }: Props) {
  const { productos } = useProductos()
  const [analizando, setAnalizando] = useState(false)
  const [menu, setMenu] = useState(false)
  const inputCamara = useRef<HTMLInputElement>(null)
  const inputGaleria = useRef<HTMLInputElement>(null)

  async function alElegir(file: File) {
    let dataURL = ''
    try {
      // 768px: resolución suficiente para que la IA lea el texto de las cajas.
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
        onClick={() => setMenu(true)}
      >
        <Icono nombre="camara" size={15} /> {analizando ? 'Analizando…' : 'Buscar por foto'}
      </button>

      {/* Modal a pantalla completa: no lo recorta ningún contenedor con overflow. */}
      {menu && (
        <div className="foto-modal-fondo" onClick={() => setMenu(false)}>
          <div className="foto-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="foto-modal-titulo">Buscar producto por foto</h3>
            <button
              type="button"
              className="foto-modal-opcion"
              onClick={() => {
                setMenu(false)
                inputCamara.current?.click()
              }}
            >
              📷 Tomar una foto con la cámara
            </button>
            <button
              type="button"
              className="foto-modal-opcion"
              onClick={() => {
                setMenu(false)
                inputGaleria.current?.click()
              }}
            >
              🖼️ Elegir de mi galería
            </button>
            <button type="button" className="foto-modal-cancelar" onClick={() => setMenu(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Cámara: en el celular "capture" abre directo la cámara trasera. */}
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
      {/* Galería: selector de archivos normal. */}
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
    </>
  )
}
