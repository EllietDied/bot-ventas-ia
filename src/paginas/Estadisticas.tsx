import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { usePedidos } from '../contexto/PedidosContext'
import { useSesion } from '../contexto/SesionContext'

// Panel de estadísticas del vendedor: métricas calculadas a partir de los datos
// reales (productos del catálogo + pedidos). Funciona en modo local y con Supabase.
export function Estadisticas() {
  const { productos } = useProductos()
  const { pedidos } = usePedidos()
  const { usuarioActual } = useSesion()
  const navegar = useNavigate()
  const stockBajoRef = useRef<HTMLElement>(null)

  // Solo los productos publicados por este vendedor.
  const mios = productos.filter((p) => p.idVendedor === usuarioActual?.idUsuario)
  const idsMios = new Set(mios.map((p) => p.id))

  // ----- Catálogo -----
  const totalProductos = mios.length
  const valorInventario = mios.reduce((s, p) => s + p.precio * p.stock, 0)
  const stockBajo = mios
    .filter((p) => p.stock > 0 && p.stock < 10)
    .sort((a, b) => a.stock - b.stock)
  const agotados = mios.filter((p) => p.stock === 0).length

  // ----- Pedidos / ventas (solo las líneas de MIS productos) -----
  const totalPedidos = pedidos.length
  const pendientes = pedidos.filter((p) => p.estado === 'pendiente').length
  let ventas = 0
  const vendidos: Record<number, { id: number; nombre: string; cantidad: number }> = {}
  for (const ped of pedidos) {
    for (const d of ped.detalles) {
      if (!idsMios.has(d.idProducto)) continue
      ventas += d.subtotal
      const e = vendidos[d.idProducto] ?? { id: d.idProducto, nombre: d.nombreProducto, cantidad: 0 }
      e.cantidad += d.cantidad
      vendidos[d.idProducto] = e
    }
  }
  const masVendidos = Object.values(vendidos)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)
  const maxVendido = masVendidos[0]?.cantidad ?? 0

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Estadísticas</h1>
        <p>Resumen de tu tienda con datos reales (productos y pedidos).</p>
      </header>

      <section className="stats-cards">
        <StatCard
          etiqueta="Mis productos"
          valor={String(totalProductos)}
          onClick={() => navegar('/vendedor')}
        />
        <StatCard
          etiqueta="Valor del inventario"
          valor={`S/ ${valorInventario.toFixed(2)}`}
          onClick={() => navegar('/vendedor/inventario')}
        />
        <StatCard
          etiqueta="Pedidos"
          valor={String(totalPedidos)}
          sub={`${pendientes} pendientes`}
          onClick={() => navegar('/pedidos')}
        />
        <StatCard
          etiqueta="Ventas (mis productos)"
          valor={`S/ ${ventas.toFixed(2)}`}
          onClick={() => navegar('/vendedor/ventas')}
        />
        <StatCard
          etiqueta="Stock bajo"
          valor={String(stockBajo.length)}
          sub={`${agotados} agotados`}
          onClick={() => stockBajoRef.current?.scrollIntoView({ behavior: 'smooth' })}
        />
      </section>

      <section className="stats-bloque">
        <h2>Productos más vendidos</h2>
        {masVendidos.length === 0 ? (
          <p className="texto-tenue">Aún no hay ventas registradas.</p>
        ) : (
          <ul className="stats-barras">
            {masVendidos.map((v) => (
              <li
                key={v.id}
                className="stats-lista-clic"
                role="button"
                tabIndex={0}
                title="Editar este producto"
                onClick={() => navegar('/vendedor/editar/' + v.id)}
              >
                <span className="stats-barra-nombre">{v.nombre}</span>
                <span className="stats-barra-track">
                  <span
                    className="stats-barra-fill"
                    style={{ width: `${maxVendido ? (v.cantidad / maxVendido) * 100 : 0}%` }}
                  />
                </span>
                <span className="stats-barra-valor">{v.cantidad}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stats-bloque" ref={stockBajoRef}>
        <h2>Stock bajo (menos de 10)</h2>
        {stockBajo.length === 0 ? (
          <p className="texto-tenue">¡Bien! No tienes productos con stock bajo.</p>
        ) : (
          <ul className="stats-lista">
            {stockBajo.map((p) => (
              <li
                key={p.id}
                className="stats-lista-clic"
                role="button"
                tabIndex={0}
                title="Editar este producto (reabastecer)"
                onClick={() => navegar('/vendedor/editar/' + p.id)}
              >
                <span>{p.nombre}</span>
                <span className={p.stock < 5 ? 'stats-alerta' : 'texto-tenue'}>
                  {p.stock} en stock
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function StatCard({
  etiqueta,
  valor,
  sub,
  onClick,
}: {
  etiqueta: string
  valor: string
  sub?: string
  onClick?: () => void
}) {
  const contenido = (
    <>
      <span className="stat-card-valor">{valor}</span>
      <span className="stat-card-etiqueta">{etiqueta}</span>
      {sub && <span className="stat-card-sub">{sub}</span>}
    </>
  )
  // Si es clicable, la renderizamos como botón (atajo a su detalle).
  if (onClick) {
    return (
      <button type="button" className="stat-card stat-card-clic" onClick={onClick}>
        {contenido}
      </button>
    )
  }
  return <div className="stat-card">{contenido}</div>
}
