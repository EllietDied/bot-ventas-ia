import { useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { usePedidos } from '../contexto/PedidosContext'
import { useSesion } from '../contexto/SesionContext'

// Detalle de VENTAS del vendedor: cuánto se vendió de cada uno de sus productos
// (unidades y monto), más los totales. Solo cuenta las líneas de SUS productos.
export function DetalleVentas() {
  const navegar = useNavigate()
  const { productos } = useProductos()
  const { pedidos } = usePedidos()
  const { usuarioActual } = useSesion()

  const mios = productos.filter((p) => p.idVendedor === usuarioActual?.idUsuario)
  const idsMios = new Set(mios.map((p) => p.id))

  // Sumamos cantidad y monto por producto, recorriendo los detalles de los pedidos.
  const porProducto: Record<number, { id: number; nombre: string; cantidad: number; monto: number }> = {}
  let totalMonto = 0
  let totalUnidades = 0
  for (const ped of pedidos) {
    for (const d of ped.detalles) {
      if (!idsMios.has(d.idProducto)) continue
      totalMonto += d.subtotal
      totalUnidades += d.cantidad
      const e = porProducto[d.idProducto] ?? {
        id: d.idProducto,
        nombre: d.nombreProducto,
        cantidad: 0,
        monto: 0,
      }
      e.cantidad += d.cantidad
      e.monto += d.subtotal
      porProducto[d.idProducto] = e
    }
  }
  const filas = Object.values(porProducto).sort((a, b) => b.monto - a.monto)

  return (
    <div className="pagina">
      <button className="btn btn-secundario btn-pequeno" onClick={() => navegar('/estadisticas')}>
        ← Volver a estadísticas
      </button>

      <header className="pagina-cabecera" style={{ marginTop: '0.8rem' }}>
        <h1>Mis ventas</h1>
        <p>Cuánto has vendido de cada producto (según los pedidos registrados).</p>
      </header>

      {/* Resumen arriba */}
      <section className="stats-cards" style={{ marginBottom: '1rem' }}>
        <div className="stat-card">
          <span className="stat-card-valor">S/ {totalMonto.toFixed(2)}</span>
          <span className="stat-card-etiqueta">Total vendido</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-valor">{totalUnidades}</span>
          <span className="stat-card-etiqueta">Unidades vendidas</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-valor">{filas.length}</span>
          <span className="stat-card-etiqueta">Productos con ventas</span>
        </div>
      </section>

      <section className="panel">
        {filas.length === 0 ? (
          <p className="texto-tenue">Aún no tienes ventas registradas.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="num">Unidades</th>
                  <th className="num">Monto vendido</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td>{f.nombre}</td>
                    <td className="num">{f.cantidad}</td>
                    <td className="num fuerte">S/ {f.monto.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className="num">{totalUnidades}</td>
                  <td className="num fuerte">S/ {totalMonto.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
