import { useState } from 'react'
import { useProductos } from '../contexto/ProductosContext'
import { useSesion } from '../contexto/SesionContext'

// Pantalla del vendedor: publicar productos y actualizar stock.
export function PanelVendedor() {
  const { productos, publicarProducto, actualizarStock } = useProductos()
  const { usuarioActual } = useSesion()

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  if (!usuarioActual) return null

  // Productos publicados por este vendedor.
  const misProductos = productos.filter((p) => p.idVendedor === usuarioActual.idUsuario)

  function publicar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setExito('')

    // Validaciones del formulario.
    if (!nombre.trim()) return setError('El nombre del producto es obligatorio.')
    if (!categoria.trim()) return setError('La categoría es obligatoria.')

    const precioNum = Number(precio)
    const stockNum = Number(stock)
    if (isNaN(precioNum) || precioNum <= 0) return setError('El precio debe ser mayor a 0.')
    if (isNaN(stockNum) || stockNum < 0) return setError('El stock no puede ser negativo.')

    publicarProducto({
      nombre,
      descripcion,
      categoria,
      precio: precioNum,
      stock: stockNum,
      idVendedor: usuarioActual!.idUsuario,
    })

    // Limpiamos el formulario y mostramos confirmación.
    setNombre('')
    setDescripcion('')
    setCategoria('')
    setPrecio('')
    setStock('')
    setExito('Producto publicado correctamente.')
  }

  return (
    <div className="pagina">
      <h1>Panel del vendedor</h1>

      <div className="vendedor-layout">
        {/* Formulario de publicación */}
        <section className="panel">
          <h2>Publicar nuevo producto</h2>
          <form className="formulario" onSubmit={publicar}>
            <label className="campo">
              <span>Nombre *</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
            <label className="campo">
              <span>Descripción</span>
              <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </label>
            <label className="campo">
              <span>Categoría *</span>
              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ej. Periféricos, Componentes..."
              />
            </label>
            <div className="form-grid">
              <label className="campo">
                <span>Precio (S/) *</span>
                <input
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  min="0"
                  step="0.1"
                />
              </label>
              <label className="campo">
                <span>Stock *</span>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"
                />
              </label>
            </div>

            {error && <p className="mensaje-error">{error}</p>}
            {exito && <p className="mensaje-exito">{exito}</p>}

            <button type="submit" className="btn btn-primario btn-bloque">
              Publicar producto
            </button>
          </form>
        </section>

        {/* Lista de productos del vendedor con actualización de stock */}
        <section className="panel">
          <h2>Mis productos ({misProductos.length})</h2>
          {misProductos.length === 0 ? (
            <p className="texto-tenue">Todavía no has publicado productos.</p>
          ) : (
            <div className="tabla-productos">
              {misProductos.map((p) => (
                <div key={p.id} className="fila-producto">
                  <span className="fila-imagen">{p.imagen}</span>
                  <span className="fila-nombre">{p.nombre}</span>
                  <span className="texto-tenue">S/ {p.precio.toFixed(2)}</span>
                  <ControlStock
                    stockActual={p.stock}
                    alActualizar={(nuevo) => actualizarStock(p.id, nuevo)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

// Pequeño control para cambiar el stock de un producto.
function ControlStock({
  stockActual,
  alActualizar,
}: {
  stockActual: number
  alActualizar: (nuevoStock: number) => void
}) {
  const [valor, setValor] = useState(String(stockActual))

  return (
    <div className="control-stock">
      <input
        type="number"
        value={valor}
        min="0"
        onChange={(e) => setValor(e.target.value)}
      />
      <button
        className="btn btn-secundario btn-pequeno"
        onClick={() => {
          const n = Number(valor)
          if (!isNaN(n) && n >= 0) alActualizar(n)
        }}
      >
        Actualizar
      </button>
    </div>
  )
}
