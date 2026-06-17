import { Producto } from '../core/modelos/Producto'

// La "imagen" de un producto puede ser:
//  - un emoji (texto), como en los productos de ejemplo (ej. "🖱️"), o
//  - una foto subida por el vendedor, guardada como dataURL ("data:image/...").
// Este helper decide cuál mostrar.
export function esFoto(imagen: string): boolean {
  return imagen.startsWith('data:') || imagen.startsWith('http')
}

interface Props {
  imagen: Producto['imagen']
  nombre: string
  // Clase extra para ajustar el tamaño de la foto según el contexto.
  className?: string
}

// Muestra la imagen del producto: una <img> si es foto, o el emoji si no.
export function ImagenProducto({ imagen, nombre, className }: Props) {
  if (esFoto(imagen)) {
    return (
      <img
        src={imagen}
        alt={nombre}
        className={'producto-foto' + (className ? ' ' + className : '')}
      />
    )
  }
  // Si es un emoji, se muestra tal cual (hereda el tamaño del contenedor).
  return <>{imagen}</>
}
