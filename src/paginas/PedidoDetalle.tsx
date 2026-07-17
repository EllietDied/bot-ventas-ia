import { useParams, useNavigate } from 'react-router-dom'
import { usePedidos } from '../contexto/PedidosContext'
import { useSesion } from '../contexto/SesionContext'
import { NOMBRE_METODO } from '../core/modelos/Pago'
import { Icono } from '../componentes/Icono'

// Página de DETALLE de un pedido: datos generales, productos, resumen de importes,
// pago y envío, presentados de forma clara y profesional.
export function PedidoDetalle() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { pedidos } = usePedidos()
  const { usuarioActual } = useSesion()

  const pedido = pedidos.find((p) => String(p.idPedido) === String(id))

  if (!usuarioActual) return null

  if (!pedido) {
    return (
      <div className="pagina">
        <p className="texto-tenue">No encontramos ese pedido.</p>
        <button className="btn btn-secundario" onClick={() => navegar('/pedidos')}>
          ← Volver a pedidos
        </button>
      </div>
    )
  }

  const e = pedido.envio
  const zona = e
    ? [e.distrito, e.provincia, e.departamento].filter(Boolean).join(', ')
    : ''

  // El pedido guarda el CORREO del comprador, no su nombre. Mostramos el nombre así:
  // si es TU propio pedido, tu nombre; si no, el de quien recibe (envío); y de último,
  // la parte del correo antes de la @.
  const nombreComprador =
    usuarioActual.correo === pedido.correoComprador
      ? `${usuarioActual.nombre} ${usuarioActual.apellido ?? ''}`.trim()
      : e?.receptor || pedido.correoComprador.split('@')[0]

  return (
    <div className="pagina">
      <button className="btn btn-secundario btn-pequeno" onClick={() => navegar('/pedidos')}>
        ← Volver a pedidos
      </button>

      <header className="pedido-detalle-cab">
        <div>
          <h1>Pedido #{pedido.idPedido}</h1>
          <p className="texto-tenue">{pedido.fecha}</p>
        </div>
        <span className={pedido.estado === 'pendiente' ? 'estado pendiente' : 'estado atendido'}>
          {pedido.estado}
        </span>
      </header>

      {/* Datos generales */}
      <section className="panel">
        <h2 className="pedido-detalle-titulo">Datos del pedido</h2>
        <ul className="detalle-ficha">
          <li>
            <strong>Comprador:</strong> {nombreComprador}
          </li>
          <li>
            <strong>Correo:</strong> {pedido.correoComprador}
          </li>
          <li>
            <strong>Método de pago:</strong>{' '}
            {pedido.pago ? NOMBRE_METODO[pedido.pago.metodoPago] : '—'}
            {pedido.pago?.banco ? ` · ${pedido.pago.banco}` : ''}
          </li>
          <li>
            <strong>Estado del pago:</strong> {pedido.pago?.estadoPago ?? '—'}
          </li>
        </ul>
      </section>

      {/* Productos */}
      <section className="panel">
        <h2 className="pedido-detalle-titulo">Productos</h2>
        <div className="tabla-scroll">
          <table className="tabla-datos">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Cantidad</th>
                <th className="num">Precio unit.</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalles.map((d) => (
                <tr key={d.idProducto}>
                  <td>{d.nombreProducto}</td>
                  <td className="num">{d.cantidad}</td>
                  <td className="num">S/ {d.precioUnitario.toFixed(2)}</td>
                  <td className="num fuerte">S/ {d.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen de importes */}
        <div className="pedido-resumen">
          <div className="pedido-resumen-fila">
            <span>Subtotal</span>
            <span>S/ {pedido.subtotal.toFixed(2)}</span>
          </div>
          {pedido.descuento > 0 && (
            <div className="pedido-resumen-fila">
              <span>Descuento</span>
              <span>− S/ {pedido.descuento.toFixed(2)}</span>
            </div>
          )}
          <div className="pedido-resumen-fila pedido-resumen-total">
            <span>Total</span>
            <span>S/ {pedido.total.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Envío (se muestra siempre; si no hay datos, lo avisamos) */}
      <section className="panel">
        <h2 className="pedido-detalle-titulo">
          <Icono nombre="caja" size={16} /> Datos de envío
        </h2>
        {e ? (
          <ul className="detalle-ficha">
            <li>
              <strong>Recibe:</strong> {e.receptor}
              {e.dni ? ` · DNI ${e.dni}` : ''}
            </li>
            <li>
              <strong>Dirección:</strong> {e.direccion}
              {zona ? `, ${zona}` : ''}
            </li>
            {e.referencia && (
              <li>
                <strong>Referencia:</strong> {e.referencia}
              </li>
            )}
            {e.telefono && (
              <li>
                <strong>Teléfono:</strong> {e.telefono}
              </li>
            )}
            {e.correo && (
              <li>
                <strong>Correo:</strong> {e.correo}
              </li>
            )}
            {pedido.empresaEnvio && (
              <li>
                <strong>Empresa de envío:</strong> {pedido.empresaEnvio}
              </li>
            )}
          </ul>
        ) : (
          <p className="texto-tenue">
            Este pedido no tiene datos de envío guardados (se registró antes de esta mejora).
          </p>
        )}
      </section>
    </div>
  )
}
