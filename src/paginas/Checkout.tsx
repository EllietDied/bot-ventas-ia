import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCarrito } from '../contexto/CarritoContext'
import { usePedidos } from '../contexto/PedidosContext'
import { useProductos } from '../contexto/ProductosContext'
import { useSesion } from '../contexto/SesionContext'
import { MetodoPago } from '../core/modelos/Pago'

// Pantalla de pago (simulado), guiada por el asistente IA.
export function Checkout() {
  const { items, subtotal, descuento, total, vaciarCarrito } = useCarrito()
  const { registrarPedido } = usePedidos()
  const { productos, actualizarStock } = useProductos()
  const { usuarioActual } = useSesion()
  const navegar = useNavigate()

  const [metodoPago, setMetodoPago] = useState<MetodoPago>('tarjeta')
  const [error, setError] = useState('')
  const [pagado, setPagado] = useState(false)
  const [totalPagado, setTotalPagado] = useState(0)

  // ----- Confirmación guiada por el asistente (después de pagar) -----
  if (pagado) {
    return (
      <div className="pagina">
        <h1>Pago</h1>
        <div className="checkout-confirmacion">
          <h2>🤖 ¡Listo! Procesé tu compra</h2>
          <p className="paso-ia">✅ Validé el stock disponible.</p>
          <p className="paso-ia">
            ✅ Calculé tu subtotal, descuento y total: <strong>S/ {totalPagado.toFixed(2)}</strong>.
          </p>
          <p className="paso-ia">✅ Tu pedido fue registrado correctamente.</p>
          <button className="btn btn-primario btn-bloque" onClick={() => navegar('/pedidos')}>
            Ver mis pedidos
          </button>
        </div>
      </div>
    )
  }

  // ----- Carrito vacío -----
  if (items.length === 0) {
    return (
      <div className="pagina">
        <h1>Pago</h1>
        <div className="vacio">
          <p>No tienes productos para pagar.</p>
          <Link to="/" className="btn btn-primario">
            Volver al asistente
          </Link>
        </div>
      </div>
    )
  }

  function pagar() {
    if (!usuarioActual) return
    setError('')

    // 0) El asistente revalida que haya stock suficiente.
    for (const item of items) {
      const actual = productos.find((p) => p.id === item.producto.id)
      if (!actual || actual.stock < item.cantidad) {
        setError(`No hay stock suficiente de ${item.producto.nombre}.`)
        return
      }
    }
    // 1) Descontamos el stock de cada producto.
    for (const item of items) {
      const actual = productos.find((p) => p.id === item.producto.id)
      if (actual) actualizarStock(actual.id, actual.stock - item.cantidad)
    }
    // 2) Registramos el pedido (incluye el pago simulado).
    registrarPedido({
      correoComprador: usuarioActual.correo,
      items,
      subtotal,
      descuento,
      total,
      metodoPago,
    })
    // 3) Mostramos la confirmación guiada por el asistente.
    setTotalPagado(total)
    setPagado(true)
    vaciarCarrito()
  }

  return (
    <div className="pagina">
      <h1>Pago</h1>
      <p className="texto-tenue">
        🤖 El asistente validará tu stock, calculará tu total y registrará tu pedido.
      </p>

      <div className="checkout-layout">
        {/* Resumen de productos */}
        <div className="checkout-detalle">
          <h2>Detalle del pedido</h2>
          {items.map((item) => (
            <div key={item.producto.id} className="checkout-linea">
              <span>
                {item.producto.imagen} {item.producto.nombre} x{item.cantidad}
              </span>
              <span>S/ {(item.producto.precio * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Método de pago y total */}
        <aside className="resumen">
          <h2>Método de pago</h2>
          <label className="campo">
            <span>Selecciona un método (simulado)</span>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}>
              <option value="tarjeta">Tarjeta</option>
              <option value="yape">Yape</option>
              <option value="plin">Plin</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </label>

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

          {error && <p className="mensaje-error">{error}</p>}

          <button className="btn btn-primario btn-bloque" onClick={pagar}>
            Pagar S/ {total.toFixed(2)}
          </button>
          <p className="texto-tenue texto-centro">El pago es simulado (demo académica).</p>
        </aside>
      </div>
    </div>
  )
}
