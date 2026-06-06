import { Link, useNavigate } from 'react-router-dom'
import { useCarrito } from '../contexto/CarritoContext'

// Pantalla del carrito de compras.
export function Carrito() {
  const { items, subtotal, descuento, total, quitarDelCarrito, cambiarCantidad, vaciarCarrito } =
    useCarrito()
  const navegar = useNavigate()

  // Carrito vacío.
  if (items.length === 0) {
    return (
      <div className="pagina">
        <h1>Tu carrito</h1>
        <div className="vacio">
          <p>Tu carrito está vacío.</p>
          <Link to="/" className="btn btn-primario">
            Pedir recomendaciones al asistente
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina">
      <h1>Tu carrito</h1>

      <div className="carrito-layout">
        {/* Lista de productos del carrito */}
        <div className="carrito-items">
          {items.map((item) => (
            <div key={item.producto.id} className="carrito-item">
              <div className="carrito-item-imagen">{item.producto.imagen}</div>
              <div className="carrito-item-info">
                <h3>{item.producto.nombre}</h3>
                <span className="texto-tenue">S/ {item.producto.precio.toFixed(2)} c/u</span>
              </div>

              <div className="carrito-item-cantidad">
                <button onClick={() => cambiarCantidad(item.producto.id, item.cantidad - 1)}>
                  −
                </button>
                <span>{item.cantidad}</span>
                <button
                  onClick={() => cambiarCantidad(item.producto.id, item.cantidad + 1)}
                  disabled={item.cantidad >= item.producto.stock}
                  title={item.cantidad >= item.producto.stock ? 'Stock máximo alcanzado' : ''}
                >
                  +
                </button>
              </div>

              <div className="carrito-item-subtotal">
                S/ {(item.producto.precio * item.cantidad).toFixed(2)}
              </div>

              <button
                className="btn-eliminar"
                onClick={() => quitarDelCarrito(item.producto.id)}
                title="Quitar"
              >
                🗑️
              </button>
            </div>
          ))}

          <button className="btn btn-secundario" onClick={vaciarCarrito}>
            Vaciar carrito
          </button>
        </div>

        {/* Resumen de la compra */}
        <aside className="resumen">
          <h2>Resumen</h2>
          <div className="resumen-linea">
            <span>Subtotal</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="resumen-linea">
            <span>Descuento</span>
            <span className="descuento">− S/ {descuento.toFixed(2)}</span>
          </div>
          <div className="resumen-linea total">
            <span>Total</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
          <button className="btn btn-primario btn-bloque" onClick={() => navegar('/checkout')}>
            Proceder al pago
          </button>
        </aside>
      </div>
    </div>
  )
}
