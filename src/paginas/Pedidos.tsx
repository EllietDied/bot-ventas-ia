import { usePedidos } from '../contexto/PedidosContext'
import { useSesion } from '../contexto/SesionContext'
import { esVendedor } from '../core/modelos/Vendedor'
import { Pedido } from '../core/modelos/Pedido'
import { NOMBRE_METODO } from '../core/modelos/Pago'
import { Icono } from '../componentes/Icono'

// Pantalla de pedidos: historial + cola de pedidos pendientes (FIFO).
export function Pedidos() {
  const { pedidos, pedidosPendientes, atenderSiguiente, pedidosDe } = usePedidos()
  const { usuarioActual } = useSesion()

  if (!usuarioActual) return null

  // El vendedor ve y atiende todos los pedidos; el comprador solo ve los suyos.
  const esVend = esVendedor(usuarioActual)
  const mios = esVend ? pedidos : pedidosDe(usuarioActual.correo)

  return (
    <div className="pagina">
      <h1>Pedidos</h1>

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
                <li key={p.idPedido}>
                  <span className="cola-pos">{i + 1}</span>
                  <span>
                    {p.idPedido} — {p.correoComprador}
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
          <p className="texto-tenue">Aún no hay pedidos registrados.</p>
        ) : (
          mios.map((p) => <TarjetaPedido key={p.idPedido} pedido={p} />)
        )}
      </section>
    </div>
  )
}

// Tarjeta con el detalle de un pedido.
function TarjetaPedido({ pedido }: { pedido: Pedido }) {
  return (
    <div className="pedido-tarjeta">
      <div className="pedido-cabecera">
        <div>
          <strong>{pedido.idPedido}</strong>
          <span className="texto-tenue"> · {pedido.fecha}</span>
        </div>
        <span className={pedido.estado === 'pendiente' ? 'estado pendiente' : 'estado atendido'}>
          {pedido.estado}
        </span>
      </div>

      <ul className="pedido-detalles">
        {pedido.detalles.map((d) => (
          <li key={d.idProducto}>
            {d.nombreProducto} x{d.cantidad}
            <span className="texto-tenue"> — S/ {d.subtotal.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="pedido-pie">
        <span className="texto-tenue">
          Pago: {pedido.pago ? NOMBRE_METODO[pedido.pago.metodoPago] : '—'}
          {pedido.pago?.banco ? ' · ' + pedido.pago.banco : ''} ({pedido.pago?.estadoPago ?? '—'})
        </span>
        <span className="pedido-total">Total: S/ {pedido.total.toFixed(2)}</span>
      </div>

      {pedido.envio && (
        <div className="pedido-envio">
          <Icono nombre="caja" size={15} /> Envío a <strong>{pedido.envio.receptor}</strong> —{' '}
          {pedido.envio.direccion}
          {pedido.envio.referencia ? ` (${pedido.envio.referencia})` : ''}
          {pedido.envio.telefono ? ` · ${pedido.envio.telefono}` : ''}
        </div>
      )}
    </div>
  )
}
