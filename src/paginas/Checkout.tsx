import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCarrito } from '../contexto/CarritoContext'
import { usePedidos } from '../contexto/PedidosContext'
import { useProductos } from '../contexto/ProductosContext'
import { useSesion } from '../contexto/SesionContext'
import { useToast } from '../contexto/ToastContext'
import { MetodoPago } from '../core/modelos/Pago'
import { ImagenProducto } from '../componentes/ImagenProducto'

// Los 4 pasos que el asistente "ejecuta" al pagar (efecto visual guiado).
const PASOS_PAGO = [
  'Validando el stock disponible',
  'Calculando el subtotal',
  'Aplicando el descuento',
  'Registrando tu pedido',
]

// Pantalla de pago (simulado), guiada paso a paso por el asistente IA.
export function Checkout() {
  const { items, subtotal, descuento, total, vaciarCarrito } = useCarrito()
  const { registrarPedido } = usePedidos()
  const { productos, actualizarStock } = useProductos()
  const { usuarioActual } = useSesion()
  const toast = useToast()
  const navegar = useNavigate()

  const [metodoPago, setMetodoPago] = useState<MetodoPago>('tarjeta')
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [pasoActual, setPasoActual] = useState(0)
  const [pagado, setPagado] = useState(false)
  const [totalPagado, setTotalPagado] = useState(0)

  // ----- Confirmación final (después de los pasos guiados) -----
  if (pagado) {
    return (
      <div className="pagina">
        <h1>Pago</h1>
        <div className="checkout-confirmacion">
          <h2>🤖 ¡Listo! Tu compra fue procesada</h2>
          <p className="paso-ia">✅ Stock validado.</p>
          <p className="paso-ia">
            ✅ Subtotal, descuento y total calculados: <strong>S/ {totalPagado.toFixed(2)}</strong>.
          </p>
          <p className="paso-ia">✅ Pedido registrado correctamente.</p>
          <button className="btn btn-primario btn-bloque" onClick={() => navegar('/pedidos')}>
            Ver mis pedidos
          </button>
        </div>
      </div>
    )
  }

  // ----- Animación de pasos: el asistente "trabajando" -----
  if (procesando) {
    return (
      <div className="pagina">
        <h1>Pago</h1>
        <p className="texto-tenue">🤖 El asistente está procesando tu compra…</p>
        <div className="checkout-pasos">
          {PASOS_PAGO.map((texto, i) => {
            const completado = pasoActual > i
            const activo = pasoActual === i
            return (
              <div
                key={i}
                className={`paso ${completado ? 'completado' : activo ? 'activo' : ''}`}
              >
                <span className="paso-icono">
                  {completado ? '✓' : activo ? <span className="spinner" /> : i + 1}
                </span>
                <span>{texto}</span>
              </div>
            )
          })}
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

    // 0) El asistente revalida que haya stock suficiente (antes de la animación).
    for (const item of items) {
      const actual = productos.find((p) => p.id === item.producto.id)
      if (!actual || actual.stock < item.cantidad) {
        setError(`No hay stock suficiente de ${item.producto.nombre}.`)
        toast.error(`Sin stock suficiente de ${item.producto.nombre}`)
        return
      }
    }

    // Iniciamos la secuencia visual de pasos.
    setTotalPagado(total)
    setProcesando(true)
    setPasoActual(0)

    setTimeout(() => setPasoActual(1), 500) // stock validado
    setTimeout(() => setPasoActual(2), 1000) // subtotal calculado
    setTimeout(() => setPasoActual(3), 1500) // descuento aplicado

    // Paso 4: aquí ocurre el trabajo real (descontar stock + registrar pedido).
    setTimeout(() => {
      for (const item of items) {
        const actual = productos.find((p) => p.id === item.producto.id)
        if (actual) actualizarStock(actual.id, actual.stock - item.cantidad)
      }
      registrarPedido({
        correoComprador: usuarioActual.correo,
        items,
        subtotal,
        descuento,
        total,
        metodoPago,
      })
      setPasoActual(4)
      vaciarCarrito()
    }, 2000)

    // Confirmación final.
    setTimeout(() => {
      setPagado(true)
      toast.exito('¡Pedido registrado correctamente! 🎉')
    }, 2700)
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
                <ImagenProducto
                  imagen={item.producto.imagen}
                  nombre={item.producto.nombre}
                  className="foto-inline"
                />{' '}
                {item.producto.nombre} x{item.cantidad}
              </span>
              <span>S/ {(item.producto.precio * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Método de pago y total */}
        <aside className="resumen">
          <h2>Método de pago</h2>
          <label className="campo">
            <span>Selecciona un método de pago</span>
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
          <p className="texto-tenue texto-centro">🔒 Pago seguro · tus datos están protegidos.</p>
        </aside>
      </div>
    </div>
  )
}
