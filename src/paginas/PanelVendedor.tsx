import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { useSesion } from '../contexto/SesionContext'
import { useConsultas } from '../contexto/ConsultasContext'
import { useMensajeria } from '../contexto/MensajeriaContext'
import { usePedidos } from '../contexto/PedidosContext'
import { useToast } from '../contexto/ToastContext'
import { ImagenProducto } from '../componentes/ImagenProducto'
import { Icono } from '../componentes/Icono'
import { comprimirImagen } from '../util/imagen'
import { codigoProducto } from '../core/modelos/Producto'
import { CATEGORIAS } from '../core/datos/categorias'

// Pantalla del vendedor: publicar productos y actualizar stock.
export function PanelVendedor() {
  const { productos, publicarProducto, actualizarStock, actualizarImagen, eliminarProducto } =
    useProductos()
  const { usuarioActual } = useSesion()
  const { consultasRecientes } = useConsultas()
  const { mensajes } = useMensajeria()
  const { pedidosPendientes } = usePedidos()
  const toast = useToast()
  const navegar = useNavigate()
  const misProductosRef = useRef<HTMLElement>(null) // para el atajo "Bajo stock"

  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [material, setMaterial] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [caracteristicas, setCaracteristicas] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [imagenes, setImagenes] = useState<string[]>([]) // galería de fotos (dataURLs)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  if (!usuarioActual) return null

  // Productos publicados por este vendedor.
  const misProductos = productos.filter((p) => p.idVendedor === usuarioActual.idUsuario)

  // ----- Datos para las "Sugerencias del asistente IA" -----
  const bajoStock = misProductos.filter((p) => p.stock <= 5)
  const masConsultados = misProductos
    .map((p) => ({
      p,
      veces: consultasRecientes.filter(
        (c) =>
          c.categoria === p.categoria || c.termino.toLowerCase().includes(p.nombre.toLowerCase()),
      ).length,
    }))
    .filter((x) => x.veces > 0)
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 3)
  const mensajesPendientes = mensajes.filter(
    (m) => m.destinatario === usuarioActual.correo && !m.leido && m.tipoMensaje === 'consulta',
  )

  async function publicar(e: React.FormEvent) {
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

    // Esperamos el resultado: solo confirmamos si de verdad se publicó.
    const creado = await publicarProducto({
      nombre,
      marca,
      modelo,
      material,
      descripcion,
      caracteristicas,
      categoria,
      precio: precioNum,
      stock: stockNum,
      idVendedor: usuarioActual!.idUsuario,
      imagenes, // galería de fotos (si está vacía, se usa un emoji)
    })
    if (!creado) {
      setError('No se pudo publicar el producto. Revisa tu conexión e inténtalo de nuevo.')
      toast.error('No se pudo publicar el producto')
      return
    }

    // Limpiamos el formulario y mostramos confirmación.
    setNombre('')
    setMarca('')
    setModelo('')
    setMaterial('')
    setDescripcion('')
    setCaracteristicas('')
    setCategoria('')
    setPrecio('')
    setStock('')
    setImagenes([])
    setExito('Producto publicado correctamente.')
    toast.exito('Producto publicado correctamente')
  }

  // El vendedor elige una o VARIAS fotos para el nuevo producto (las comprime y agrega).
  async function alElegirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? [])
    if (archivos.length === 0) return
    try {
      const nuevas = await Promise.all(archivos.map((a) => comprimirImagen(a)))
      setImagenes((prev) => [...prev, ...nuevas].slice(0, 6)) // hasta 6 fotos
    } catch {
      toast.error('No se pudo procesar alguna imagen.')
    }
    e.target.value = '' // permite volver a elegir los mismos archivos
  }

  // Quita una foto de la galería del nuevo producto (por su posición).
  function quitarImagen(indice: number) {
    setImagenes((prev) => prev.filter((_, i) => i !== indice))
  }

  // El vendedor cambia la foto de un producto YA publicado.
  async function alCambiarImagen(e: React.ChangeEvent<HTMLInputElement>, id: number) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    try {
      actualizarImagen(id, await comprimirImagen(archivo))
      toast.exito('Foto actualizada')
    } catch {
      toast.error('No se pudo procesar la imagen.')
    }
    e.target.value = '' // permite volver a elegir el mismo archivo
  }

  return (
    <div className="pagina">
      <h1>Panel del vendedor</h1>

      {/* Sugerencias del asistente IA */}
      <section className="panel sugerencias-ia">
        <h2>
          <Icono nombre="ia" size={18} /> Sugerencias del asistente IA
        </h2>
        <div className="sugerencias-grid">
          <div
            className="sugerencia sugerencia-clic"
            role="button"
            tabIndex={0}
            title="Ver tus productos para reabastecer"
            onClick={() => misProductosRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="sugerencia-num">{bajoStock.length}</span>
            <div>
              <strong>Bajo stock</strong>
              <p className="texto-tenue">
                {bajoStock.length === 0 ? 'Todo en orden.' : bajoStock.map((p) => p.nombre).join(', ')}
              </p>
            </div>
          </div>
          <div
            className="sugerencia sugerencia-clic"
            role="button"
            tabIndex={0}
            title="Ver estadísticas"
            onClick={() => navegar('/estadisticas')}
          >
            <span className="sugerencia-num">{masConsultados.length}</span>
            <div>
              <strong>Más consultados</strong>
              <p className="texto-tenue">
                {masConsultados.length === 0
                  ? 'Sin consultas aún.'
                  : masConsultados.map((x) => `${x.p.nombre} (${x.veces})`).join(', ')}
              </p>
            </div>
          </div>
          <div
            className="sugerencia sugerencia-clic"
            role="button"
            tabIndex={0}
            title="Ir a Mensajes"
            onClick={() => navegar('/mensajes')}
          >
            <span className="sugerencia-num">{mensajesPendientes.length}</span>
            <div>
              <strong>Mensajes pendientes</strong>
              <p className="texto-tenue">
                {mensajesPendientes.length === 0 ? 'Sin mensajes nuevos.' : 'Consultas por responder.'}
              </p>
            </div>
          </div>
          <div
            className="sugerencia sugerencia-clic"
            role="button"
            tabIndex={0}
            title="Ir a Pedidos"
            onClick={() => navegar('/pedidos')}
          >
            <span className="sugerencia-num">{pedidosPendientes.length}</span>
            <div>
              <strong>Pedidos pendientes</strong>
              <p className="texto-tenue">
                {pedidosPendientes.length === 0 ? 'Sin pedidos por atender.' : 'Pedidos por atender.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="vendedor-layout">
        {/* Formulario de publicación */}
        <section className="panel">
          <h2>Publicar nuevo producto</h2>
          <form className="formulario" onSubmit={publicar}>
            <label className="campo">
              <span>Nombre *</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
            <div className="form-grid">
              <label className="campo">
                <span>Marca</span>
                <input
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ej. Logitech, Asus..."
                />
              </label>
              <label className="campo">
                <span>Modelo</span>
                <input
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  placeholder="Ej. G502 HERO"
                />
              </label>
            </div>
            <label className="campo">
              <span>Material</span>
              <input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Ej. Plástico ABS, aluminio, aleación..."
              />
            </label>
            <label className="campo">
              <span>Descripción</span>
              <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </label>
            <label className="campo">
              <span>Características (una por línea)</span>
              <textarea
                value={caracteristicas}
                onChange={(e) => setCaracteristicas(e.target.value)}
                rows={4}
                placeholder={'Ej.\n6 botones programables\nSensor óptico 25K DPI\nLuces RGB'}
              />
            </label>
            <label className="campo">
              <span>Categoría *</span>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Elige una categoría…</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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

            <label className="campo">
              <span>Fotos del producto (puedes elegir varias · máx. 6)</span>
              <input type="file" accept="image/*" multiple onChange={alElegirImagen} />
            </label>
            {imagenes.length > 0 && (
              <div className="preview-galeria">
                {imagenes.map((img, i) => (
                  <div key={i} className="preview-galeria-item">
                    <img src={img} alt={`Foto ${i + 1}`} />
                    {i === 0 && <span className="preview-principal">Principal</span>}
                    <button
                      type="button"
                      className="preview-quitar"
                      title="Quitar foto"
                      aria-label="Quitar foto"
                      onClick={() => quitarImagen(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="mensaje-error">{error}</p>}
            {exito && <p className="mensaje-exito">{exito}</p>}

            <button type="submit" className="btn btn-primario btn-bloque">
              Publicar producto
            </button>
          </form>
        </section>

        {/* Lista de productos del vendedor con actualización de stock */}
        <section className="panel" ref={misProductosRef}>
          <h2>Mis productos ({misProductos.length})</h2>
          {misProductos.length === 0 ? (
            <p className="texto-tenue">Todavía no has publicado productos.</p>
          ) : (
            <div className="tabla-productos">
              {misProductos.map((p) => (
                <div key={p.id} className="fila-producto">
                  <label className="fila-imagen" title="Cambiar foto">
                    <ImagenProducto imagen={p.imagen} nombre={p.nombre} />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => alCambiarImagen(e, p.id)}
                    />
                  </label>
                  <button
                    type="button"
                    className="fila-nombre fila-nombre-btn"
                    title="Editar este producto"
                    onClick={() => navegar('/vendedor/editar/' + p.id)}
                  >
                    {p.nombre}
                    <small className="fila-codigo">{codigoProducto(p)}</small>
                  </button>
                  <span className="texto-tenue">S/ {p.precio.toFixed(2)}</span>
                  <ControlStock
                    stockActual={p.stock}
                    alActualizar={(nuevo) => actualizarStock(p.id, nuevo)}
                  />
                  <BotonEliminar
                    nombre={p.nombre}
                    alEliminar={() => {
                      eliminarProducto(p.id)
                      toast.info(`"${p.nombre}" eliminado`)
                    }}
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

// Botón de eliminar con confirmación en dos pasos (sin diálogo nativo del navegador).
function BotonEliminar({ nombre, alEliminar }: { nombre: string; alEliminar: () => void }) {
  const [confirmando, setConfirmando] = useState(false)
  if (confirmando) {
    return (
      <span className="confirm-eliminar">
        <button className="btn btn-peligro btn-pequeno" onClick={alEliminar}>
          Eliminar
        </button>
        <button className="btn btn-secundario btn-pequeno" onClick={() => setConfirmando(false)}>
          Cancelar
        </button>
      </span>
    )
  }
  return (
    <button
      className="btn-eliminar"
      title={`Eliminar ${nombre}`}
      aria-label={`Eliminar ${nombre}`}
      onClick={() => setConfirmando(true)}
    >
      <Icono nombre="eliminar" size={18} />
    </button>
  )
}
