import { Producto } from '../core/modelos/Producto'
import { ImagenProducto } from './ImagenProducto'

interface Props {
  producto: Producto
  // Acción opcional del botón (ej. agregar al carrito).
  alAgregar?: (producto: Producto) => void
}

// Tarjeta visual de un producto del catálogo.
export function TarjetaProducto({ producto, alAgregar }: Props) {
  const agotado = producto.stock <= 0
  const bajoStock = producto.stock > 0 && producto.stock <= 5

  return (
    <div className="tarjeta-producto">
      <div className="tarjeta-imagen">
        <ImagenProducto imagen={producto.imagen} nombre={producto.nombre} />
      </div>
      <span className="tarjeta-categoria">{producto.categoria}</span>
      <h3 className="tarjeta-nombre">{producto.nombre}</h3>
      {producto.marca && <p className="tarjeta-marca texto-tenue">Marca: {producto.marca}</p>}
      <p className="tarjeta-descripcion">{producto.descripcion}</p>

      <div className="tarjeta-pie">
        <span className="tarjeta-precio">S/ {producto.precio.toFixed(2)}</span>
        <span
          className={
            agotado ? 'tarjeta-stock agotado' : bajoStock ? 'tarjeta-stock bajo' : 'tarjeta-stock'
          }
        >
          {agotado ? 'Agotado' : `Stock: ${producto.stock}`}
        </span>
      </div>

      {alAgregar && (
        <button
          className="btn btn-primario btn-bloque"
          disabled={agotado}
          onClick={() => alAgregar(producto)}
        >
          {agotado ? 'Sin stock' : 'Agregar al carrito'}
        </button>
      )}
    </div>
  )
}
