import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCarrito } from '../contexto/CarritoContext'
import { usePedidos } from '../contexto/PedidosContext'
import { useProductos } from '../contexto/ProductosContext'
import { useSesion } from '../contexto/SesionContext'
import { useToast } from '../contexto/ToastContext'
import { MetodoPago } from '../core/modelos/Pago'
import { ImagenProducto } from '../componentes/ImagenProducto'
import { Icono } from '../componentes/Icono'

// Los 4 pasos que el asistente "ejecuta" al pagar (efecto visual guiado).
const PASOS_PAGO = [
  'Validando el stock disponible',
  'Calculando el subtotal',
  'Aplicando el descuento',
  'Registrando tu pedido',
]

// Iconos representativos por tipo de pago (no son los logos de marca: usan un
// icono del tipo de pago en el color característico de cada una, así se reconocen).
const IC = {
  tarjeta: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  ),
  telefono: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </svg>
  ),
  banco: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-5 9 5" />
      <path d="M4 9v9M20 9v9M8 9v6M12 9v6M16 9v6" />
      <path d="M2 21h20" />
    </svg>
  ),
  voucher: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5-2 1.5-2.5-1.5L5 21z" />
      <path d="M9 8h6M9 12h5" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M16 14.5h2" />
    </svg>
  ),
  coins: (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="9" cy="7.5" rx="6" ry="3" />
      <path d="M3 7.5v4c0 1.7 2.7 3 6 3" />
      <circle cx="16" cy="14.5" r="5" />
    </svg>
  ),
}

// Métodos de pago con su nombre, color de marca e icono.
const METODOS: { id: MetodoPago; nombre: string; color: string; icono: JSX.Element }[] = [
  { id: 'tarjeta', nombre: 'Tarjeta', color: '#2563eb', icono: IC.tarjeta },
  { id: 'yape', nombre: 'Yape', color: '#742d8b', icono: IC.telefono },
  { id: 'plin', nombre: 'Plin', color: '#0aa6c0', icono: IC.telefono },
  { id: 'transferencia', nombre: 'Transferencia', color: '#0e8a7e', icono: IC.banco },
  { id: 'pagoefectivo', nombre: 'PagoEfectivo', color: '#ef5b0c', icono: IC.voucher },
  { id: 'paypal', nombre: 'PayPal', color: '#0070ba', icono: IC.wallet },
  { id: 'mercadopago', nombre: 'Mercado Pago', color: '#00a6e0', icono: IC.coins },
]

// Bancos para la transferencia, con su color característico.
const BANCOS_INFO = [
  { nombre: 'Interbank', color: '#0d9b4e' },
  { nombre: 'Scotiabank', color: '#e3001b' },
  { nombre: 'BCP', color: '#f07000' },
  { nombre: 'BBVA', color: '#004481' },
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
  const [banco, setBanco] = useState('') // banco elegido (solo para transferencia)
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
          <h2>
            <Icono nombre="check" size={22} /> ¡Listo! Tu compra fue procesada
          </h2>
          <p className="paso-ia">
            <Icono nombre="check" size={16} /> Stock validado.
          </p>
          <p className="paso-ia">
            <Icono nombre="check" size={16} /> Subtotal, descuento y total calculados:{' '}
            <strong>S/ {totalPagado.toFixed(2)}</strong>.
          </p>
          <p className="paso-ia">
            <Icono nombre="check" size={16} /> Pedido registrado correctamente.
          </p>
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
        <p className="texto-tenue">
          <Icono nombre="ia" size={16} /> El asistente está procesando tu compra…
        </p>
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

    // La transferencia requiere elegir el banco.
    if (metodoPago === 'transferencia' && !banco) {
      setError('Elige tu banco para la transferencia.')
      toast.error('Elige tu banco para la transferencia')
      return
    }

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
        banco: metodoPago === 'transferencia' ? banco : undefined,
      })
      setPasoActual(4)
      vaciarCarrito()
    }, 2000)

    // Confirmación final.
    setTimeout(() => {
      setPagado(true)
      toast.exito('¡Pedido registrado correctamente!')
    }, 2700)
  }

  return (
    <div className="pagina">
      <h1>Pago</h1>
      <p className="texto-tenue">
        <Icono nombre="ia" size={16} /> El asistente validará tu stock, calculará tu total y
        registrará tu pedido.
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
          <p className="metodos-pago-titulo">Selecciona un método de pago</p>
          <div className="metodos-pago">
            {METODOS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={'metodo-pago' + (metodoPago === m.id ? ' activo' : '')}
                onClick={() => {
                  setMetodoPago(m.id)
                  if (m.id !== 'transferencia') setBanco('')
                  setError('')
                }}
                aria-pressed={metodoPago === m.id}
              >
                <span className="metodo-icono" style={{ color: m.color }}>
                  {m.icono}
                </span>
                <span className="metodo-nombre">{m.nombre}</span>
              </button>
            ))}
          </div>

          {/* Al elegir Transferencia, se selecciona el banco */}
          {metodoPago === 'transferencia' && (
            <div className="bancos">
              <p className="bancos-titulo">Elige tu banco:</p>
              <div className="bancos-lista">
                {BANCOS_INFO.map((b) => (
                  <button
                    key={b.nombre}
                    type="button"
                    className={'banco-chip' + (banco === b.nombre ? ' activo' : '')}
                    onClick={() => {
                      setBanco(b.nombre)
                      setError('')
                    }}
                    aria-pressed={banco === b.nombre}
                  >
                    <span className="banco-icono" style={{ color: b.color }}>
                      {IC.banco}
                    </span>
                    <span>{b.nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
          <p className="texto-tenue texto-centro">
            <Icono nombre="candado" size={15} /> Pago seguro · tus datos están protegidos.
          </p>
        </aside>
      </div>
    </div>
  )
}
