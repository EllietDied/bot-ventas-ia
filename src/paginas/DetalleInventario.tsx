import { useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { useSesion } from '../contexto/SesionContext'

// Detalle del VALOR DEL INVENTARIO: cada producto del vendedor con su precio,
// stock y el valor que representa (precio × stock), más el total general.
export function DetalleInventario() {
  const navegar = useNavigate()
  const { productos } = useProductos()
  const { usuarioActual } = useSesion()

  const mios = productos.filter((p) => p.idVendedor === usuarioActual?.idUsuario)
  // Ordenados por el valor que aportan (mayor a menor).
  const ordenados = [...mios].sort((a, b) => b.precio * b.stock - a.precio * a.stock)
  const total = mios.reduce((s, p) => s + p.precio * p.stock, 0)
  const totalUnidades = mios.reduce((s, p) => s + p.stock, 0)

  return (
    <div className="pagina">
      <button className="btn btn-secundario btn-pequeno" onClick={() => navegar('/estadisticas')}>
        ← Volver a estadísticas
      </button>

      <header className="pagina-cabecera" style={{ marginTop: '0.8rem' }}>
        <h1>Valor del inventario</h1>
        <p>El detalle de cada producto y cuánto vale tu stock en total.</p>
      </header>

      {/* Resumen arriba */}
      <section className="stats-cards" style={{ marginBottom: '1rem' }}>
        <div className="stat-card">
          <span className="stat-card-valor">S/ {total.toFixed(2)}</span>
          <span className="stat-card-etiqueta">Valor total</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-valor">{mios.length}</span>
          <span className="stat-card-etiqueta">Productos</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-valor">{totalUnidades}</span>
          <span className="stat-card-etiqueta">Unidades en stock</span>
        </div>
      </section>

      <section className="panel">
        {mios.length === 0 ? (
          <p className="texto-tenue">Todavía no tienes productos publicados.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="num">Precio</th>
                  <th className="num">Stock</th>
                  <th className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td className="texto-tenue">{p.categoria}</td>
                    <td className="num">S/ {p.precio.toFixed(2)}</td>
                    <td className="num">{p.stock}</td>
                    <td className="num fuerte">S/ {(p.precio * p.stock).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>Total del inventario</td>
                  <td className="num fuerte">S/ {total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
