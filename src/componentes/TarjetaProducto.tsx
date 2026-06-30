import { Producto, codigoProducto } from '../core/modelos/Producto'
import { ImagenProducto } from './ImagenProducto'
import { useSesion } from '../contexto/SesionContext'

interface Props {
  producto: Producto
  // Acción opcional del botón (ej. agregar al carrito).
  alAgregar?: (producto: Producto) => void
  // Texto del botón cuando hay stock (por defecto "Agregar al carrito").
  textoBoton?: string
}

// Tarjeta visual de un producto del catálogo.
export function TarjetaProducto({ producto, alAgregar, textoBoton }: Props) {
  const { usuarioActual } = useSesion()
  // El código del producto es información interna: solo lo ve el vendedor.
  const esVendedor = usuarioActual?.rol === 'vendedor'
  const agotado = producto.stock <= 0
  const bajoStock = producto.stock > 0 && producto.stock <= 5

  return (
    <div className="tarjeta-producto">
      <div className="tarjeta-imagen">
        <ImagenProducto imagen={producto.imagen} nombre={producto.nombre} />
      </div>
      <span className="tarjeta-categoria">{producto.categoria}</span>
      {esVendedor && (
        <span className="tarjeta-codigo" title="Código del producto">{codigoProducto(producto)}</span>
      )}
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
          {agotado ? 'Sin stock' : (textoBoton ?? 'Agregar al carrito')}
        </button>
      )}
    </div>
  )
}
