import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { useCarrito } from '../contexto/CarritoContext'
import { useSesion } from '../contexto/SesionContext'
import { useToast } from '../contexto/ToastContext'
import { ImagenProducto } from '../componentes/ImagenProducto'
import { codigoProducto } from '../core/modelos/Producto'
import { esComprador } from '../core/modelos/Comprador'

// Página de DETALLE de un producto: galería de fotos + ficha completa.
export function DetalleProducto() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { productos } = useProductos()
  const { agregarAlCarrito } = useCarrito()
  const { usuarioActual } = useSesion()
  const toast = useToast()

  const producto = productos.find((p) => String(p.id) === String(id))
  const [fotoActiva, setFotoActiva] = useState(0)

  // Si el producto no existe (o aún carga el catálogo), avisamos con una salida clara.
  if (!producto) {
    return (
      <div className="pagina">
        <p className="texto-tenue">No encontramos ese producto.</p>
        <button className="btn btn-secundario" onClick={() => navegar('/catalogo')}>
          ← Volver al catálogo
        </button>
      </div>
    )
  }

  const esVendedor = usuarioActual?.rol === 'vendedor'
  const esVisitante = !usuarioActual
  const puedeComprar = usuarioActual ? esComprador(usuarioActual) : false
  const agotado = producto.stock <= 0

  // Galería: si el producto tiene varias fotos usamos esas; si no, su imagen principal.
  const galeria =
    producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes : [producto.imagen]
  const fotoSel = galeria[Math.min(fotoActiva, galeria.length - 1)]

  // Las características se guardan como texto (una por línea); las mostramos como lista.
  const lineasCaract = (producto.caracteristicas ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  function comprar() {
    if (esVisitante) {
      toast.info('Inicia sesión para comprar.')
      navegar('/login')
      return
    }
    if (!producto) return
    agregarAlCarrito(producto)
    toast.exito(`${producto.nombre} agregado al carrito`)
  }

  function consultarVendedor() {
    if (!producto) return
    navegar('/mensajes', { state: { idProducto: producto.id } })
  }

  return (
    <div className="pagina">
      <button className="btn btn-secundario btn-pequeno" onClick={() => navegar(-1)}>
        ← Volver
      </button>

      <div className="detalle-producto">
        {/* Galería de fotos */}
        <div className="detalle-galeria">
          <div className="detalle-foto-principal">
            <ImagenProducto imagen={fotoSel} nombre={producto.nombre} className="detalle-foto" />
          </div>
          {galeria.length > 1 && (
            <div className="detalle-miniaturas">
              {galeria.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className={'detalle-mini' + (i === fotoActiva ? ' activa' : '')}
                  onClick={() => setFotoActiva(i)}
                  aria-label={`Ver foto ${i + 1}`}
                >
                  <ImagenProducto imagen={img} nombre={`Foto ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="detalle-info">
          <div className="detalle-etiquetas">
            <span className="tarjeta-categoria">{producto.categoria}</span>
            {/* El código es información interna: solo lo ve el vendedor. */}
            {esVendedor && <span className="tarjeta-codigo">{codigoProducto(producto)}</span>}
          </div>

          <h1 className="detalle-nombre">{producto.nombre}</h1>

          {/* Ficha de datos técnicos */}
          <ul className="detalle-ficha">
            {producto.marca && (
              <li>
                <strong>Marca:</strong> {producto.marca}
              </li>
            )}
            {producto.modelo && (
              <li>
                <strong>Modelo:</strong> {producto.modelo}
              </li>
            )}
            {producto.material && (
              <li>
                <strong>Material:</strong> {producto.material}
              </li>
            )}
            <li>
              <strong>Categoría:</strong> {producto.categoria}
            </li>
          </ul>

          <div className="detalle-precio-fila">
            <span className="tarjeta-precio">S/ {producto.precio.toFixed(2)}</span>
            <span className={agotado ? 'tarjeta-stock agotado' : 'tarjeta-stock'}>
              {agotado ? 'Agotado' : `Stock: ${producto.stock}`}
            </span>
          </div>

          {producto.descripcion && (
            <section className="detalle-bloque">
              <h2>Descripción</h2>
              <p>{producto.descripcion}</p>
            </section>
          )}

          {lineasCaract.length > 0 && (
            <section className="detalle-bloque">
              <h2>Características</h2>
              <ul className="detalle-caracteristicas">
                {lineasCaract.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </section>
          )}

          {producto.vendedorNombre && (
            <p className="texto-tenue detalle-vendedor">Vendido por: {producto.vendedorNombre}</p>
          )}

          {/* Acciones: el vendedor solo observa; el comprador/visitante puede actuar. */}
          {!esVendedor && (
            <div className="detalle-acciones">
              <button className="btn btn-primario" disabled={agotado} onClick={comprar}>
                {agotado
                  ? 'Sin stock'
                  : esVisitante
                    ? 'Inicia sesión para comprar'
                    : 'Agregar al carrito'}
              </button>
              {puedeComprar && (
                <button className="btn btn-secundario" onClick={consultarVendedor}>
                  Consultar al vendedor
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
