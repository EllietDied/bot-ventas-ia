import { useNavigate } from 'react-router-dom'
import { usePedidos } from '../contexto/PedidosContext'
import { useSesion } from '../contexto/SesionContext'
import { esVendedor } from '../core/modelos/Vendedor'
import { Pedido } from '../core/modelos/Pedido'
import { NOMBRE_METODO } from '../core/modelos/Pago'
import { Icono } from '../componentes/Icono'

// Nombre a mostrar del comprador: el guardado en el pedido o, si no, el correo.
function nombreComprador(p: Pedido): string {
  return p.compradorNombre || p.correoComprador || 'Comprador'
}

// Resumen corto de los productos: "Monitor 27, Audífonos y 1 más".
function resumenProductos(p: Pedido): string {
  const nombres = p.detalles.map((d) => d.nombreProducto)
  if (nombres.length <= 2) return nombres.join(', ')
  return `${nombres.slice(0, 2).join(', ')} y ${nombres.length - 2} más`
}

// Cantidad total de artículos del pedido (suma de cantidades).
function totalArticulos(p: Pedido): number {
  return p.detalles.reduce((s, d) => s + d.cantidad, 0)
}

// Pantalla de pedidos: historial + cola de pedidos pendientes (FIFO).
export function Pedidos() {
  const { pedidos, pedidosPendientes, atenderSiguiente, pedidosDe } = usePedidos()
  const { usuarioActual } = useSesion()
  const navegar = useNavigate()

  if (!usuarioActual) return null

  // El vendedor ve y atiende todos los pedidos; el comprador solo ve los suyos.
  const esVend = esVendedor(usuarioActual)
  const mios = esVend ? pedidos : pedidosDe(usuarioActual.correo)

  // Datos para el resumen de arriba.
  const montoTotal = mios.reduce((s, p) => s + p.total, 0)
  const pendientes = mios.filter((p) => p.estado === 'pendiente').length

  return (
    <div className="pagina">
      <h1>Pedidos</h1>

      {/* Resumen rápido (mini tarjetas de datos) */}
      {mios.length > 0 && (
        <div className="pedidos-resumen">
          <div className="pedidos-resumen-item">
            <span className="pedidos-resumen-num">{mios.length}</span>
            <span className="pedidos-resumen-lbl">
              {esVend ? 'Pedidos recibidos' : 'Mis pedidos'}
            </span>
          </div>
          <div className="pedidos-resumen-item">
            <span className="pedidos-resumen-num">{pendientes}</span>
            <span className="pedidos-resumen-lbl">Pendientes</span>
          </div>
          <div className="pedidos-resumen-item">
            <span className="pedidos-resumen-num">S/ {montoTotal.toFixed(2)}</span>
            <span className="pedidos-resumen-lbl">
              {esVend ? 'Monto total' : 'Total gastado'}
            </span>
          </div>
        </div>
      )}

      {/* COLA FIFO: pedidos pendientes — solo el vendedor los atiende */}
      {esVend && (
        <section className="panel">
          <div className="panel-cabecera">
            <h2>
              <Icono nombre="reloj" size={18} /> Pedidos pendientes
            </h2>
            <button
              className="btn btn-primario btn-pequeno"
              onClick={() => atenderSiguiente()}
              disabled={pedidosPendientes.length === 0}
            >
              Atender siguiente
            </button>
          </div>
          <p className="texto-tenue">
            Se atienden en el orden en que llegaron: el primero en entrar es el primero en salir.
          </p>

          {pedidosPendientes.length === 0 ? (
            <p className="texto-tenue">No hay pedidos pendientes.</p>
          ) : (
            <ol className="cola-lista">
              {pedidosPendientes.map((p, i) => (
                <li
                  key={p.idPedido}
                  className="cola-clic"
                  role="button"
                  tabIndex={0}
                  title="Ver el detalle del pedido"
                  onClick={() => navegar('/pedidos/' + p.idPedido)}
                >
                  <span className="cola-pos">{i + 1}</span>
                  <span className="cola-info">
                    <strong>Pedido #{p.idPedido}</strong>
                    <span className="texto-tenue">{nombreComprador(p)}</span>
                  </span>
                  <span className="cola-total">S/ {p.total.toFixed(2)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* Historial de pedidos */}
      <section>
        <h2>{esVend ? 'Todos los pedidos' : 'Mi historial de pedidos'}</h2>
        {mios.length === 0 ? (
          <div className="pedidos-vacio">
            <Icono nombre="caja" size={34} />
            <p>Aún no hay pedidos registrados.</p>
          </div>
        ) : (
          mios.map((p) => (
            <TarjetaPedido
              key={p.idPedido}
              pedido={p}
              esVend={esVend}
              onVer={() => navegar('/pedidos/' + p.idPedido)}
            />
          ))
        )}
      </section>
    </div>
  )
}

// Tarjeta con el resumen de un pedido (clic → ver su detalle completo).
function TarjetaPedido({
  pedido,
  esVend,
  onVer,
}: {
  pedido: Pedido
  esVend: boolean
  onVer: () => void
}) {
  const articulos = totalArticulos(pedido)
  return (
    <div
      className={
        'pedido-tarjeta pedido-tarjeta-clic ' +
        (pedido.estado === 'pendiente' ? 'pedido-tarjeta--pendiente' : 'pedido-tarjeta--atendido')
      }
      role="button"
      tabIndex={0}
      title="Ver el detalle del pedido"
      onClick={onVer}
    >
      <div className="pedido-cabecera">
        <div className="pedido-titulo">
          <strong>Pedido #{pedido.idPedido}</strong>
          <span className="texto-tenue">{pedido.fecha}</span>
        </div>
        <span className={pedido.estado === 'pendiente' ? 'estado pendiente' : 'estado atendido'}>
          {pedido.estado}
        </span>
      </div>

      {/* Comprador (útil sobre todo para el vendedor) */}
      {esVend && (
        <div className="pedido-comprador">
          <span className="pedido-comprador-lbl">Comprador</span> {nombreComprador(pedido)}
        </div>
      )}

      {/* Resumen de productos */}
      <div className="pedido-linea-productos">
        <Icono nombre="caja" size={15} />
        <span>{resumenProductos(pedido)}</span>
        <span className="pedido-articulos">
          {articulos} {articulos === 1 ? 'artículo' : 'artículos'}
        </span>
      </div>

      <div className="pedido-pie">
        <span className="texto-tenue">
          {pedido.pago ? NOMBRE_METODO[pedido.pago.metodoPago] : '—'}
          {pedido.pago?.banco ? ' · ' + pedido.pago.banco : ''}
          {pedido.pago?.estadoPago ? ` · ${pedido.pago.estadoPago}` : ''}
        </span>
        <span className="pedido-total">S/ {pedido.total.toFixed(2)}</span>
      </div>

      {pedido.envio && (
        <div className="pedido-envio">
          <Icono nombre="caja" size={15} /> Envío a <strong>{pedido.envio.receptor}</strong>
          {pedido.empresaEnvio ? ` · 🚚 ${pedido.empresaEnvio}` : ''}
        </div>
      )}

      <div className="pedido-ver">Ver detalle →</div>
    </div>
  )
}
