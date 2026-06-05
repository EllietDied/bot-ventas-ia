import { useProductos } from '../contexto/ProductosContext'
import { useSesion } from '../contexto/SesionContext'
import { usePedidos } from '../contexto/PedidosContext'
import { useConsultas } from '../contexto/ConsultasContext'
import { useCarrito } from '../contexto/CarritoContext'
import { useMensajeria } from '../contexto/MensajeriaContext'

// Pantalla de EVIDENCIA ACADÉMICA.
// Muestra de forma visible las estructuras de datos y los cálculos del RA1:
// Listas (arreglos), Cola FIFO, Pila LIFO y el cálculo de totales.
export function Evidencia() {
  const { productos } = useProductos()
  const { usuarios } = useSesion()
  const { pedidos, pedidosPendientes, atenderSiguiente } = usePedidos()
  const { consultasRecientes } = useConsultas()
  const { items, subtotal, descuento, total } = useCarrito()
  const { mensajes } = useMensajeria()

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>📊 Evidencia académica</h1>
        <p>Visualización de las estructuras de datos y los cálculos del sistema (RA1).</p>
      </header>

      {/* ============ LISTAS (arreglos) ============ */}
      <section className="panel">
        <h2>📋 Listas (estructura: arreglo)</h2>

        <div className="evidencia-grid">
          {/* Lista de productos */}
          <div>
            <h3>Productos ({productos.length})</h3>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.nombre}</td>
                      <td>{p.categoria}</td>
                      <td>S/ {p.precio.toFixed(2)}</td>
                      <td>{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lista de usuarios */}
          <div>
            <h3>Usuarios ({usuarios.length})</h3>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.idUsuario}>
                      <td>
                        {u.nombre} {u.apellido}
                      </td>
                      <td>{u.correo}</td>
                      <td>{u.rol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lista de pedidos */}
        <h3>Pedidos ({pedidos.length})</h3>
        {pedidos.length === 0 ? (
          <p className="texto-tenue">Todavía no hay pedidos registrados.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Comprador</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.idPedido}>
                    <td>{p.idPedido}</td>
                    <td>{p.correoComprador}</td>
                    <td>S/ {p.total.toFixed(2)}</td>
                    <td>{p.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lista de mensajes (RF10) */}
        <h3>Mensajes ({mensajes.length})</h3>
        {mensajes.length === 0 ? (
          <p className="texto-tenue">Todavía no hay mensajes.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>De</th>
                  <th>Para</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Leído</th>
                </tr>
              </thead>
              <tbody>
                {mensajes.map((m) => (
                  <tr key={m.idMensaje}>
                    <td>{m.remitente}</td>
                    <td>{m.destinatario}</td>
                    <td>{m.nombreProducto}</td>
                    <td>{m.tipoMensaje}</td>
                    <td>{m.leido ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ============ COLA FIFO ============ */}
      <section className="panel">
        <div className="panel-cabecera">
          <h2>🕒 Cola FIFO — pedidos pendientes ({pedidosPendientes.length})</h2>
          <button
            className="btn btn-primario btn-pequeno"
            onClick={() => atenderSiguiente()}
            disabled={pedidosPendientes.length === 0}
          >
            Atender siguiente
          </button>
        </div>
        <p className="texto-tenue">
          First In, First Out: el primer pedido en entrar es el primero en ser atendido.
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

      {/* ============ PILA LIFO ============ */}
      <section className="panel">
        <h2>🧾 Pila LIFO — consultas recientes ({consultasRecientes.length})</h2>
        <p className="texto-tenue">
          Last In, First Out: la última consulta realizada aparece en primer lugar.
        </p>
        {consultasRecientes.length === 0 ? (
          <p className="texto-tenue">Aún no hay consultas. Usa el buscador o el chatbot.</p>
        ) : (
          <ol className="cola-lista">
            {consultasRecientes.map((c, i) => (
              <li key={i}>
                <span className="cola-pos">{i + 1}</span>
                <span>{c.termino}</span>
                {c.categoria && <span className="chip-mini">{c.categoria}</span>}
                <span className="cola-total texto-tenue">{c.fechaHora}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ============ CÁLCULO DE TOTALES ============ */}
      <section className="panel">
        <h2>🧮 Cálculo: subtotal, descuento y total</h2>
        <p className="texto-tenue">
          Regla de descuento: 10% si el subtotal ≥ S/ 3000, 5% si ≥ S/ 1000, 0% si es menor.
        </p>
        {items.length === 0 ? (
          <p className="texto-tenue">
            El carrito está vacío. Agrega productos para ver el cálculo en vivo.
          </p>
        ) : (
          <div className="evidencia-calculo">
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cantidad</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.producto.id}>
                      <td>{item.producto.nombre}</td>
                      <td>S/ {item.producto.precio.toFixed(2)}</td>
                      <td>{item.cantidad}</td>
                      <td>S/ {(item.producto.precio * item.cantidad).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="resumen">
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
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
