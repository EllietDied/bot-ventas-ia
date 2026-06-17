import { useState } from 'react'
import { useProductos } from '../contexto/ProductosContext'
import { useSesion } from '../contexto/SesionContext'
import { useConsultas } from '../contexto/ConsultasContext'
import { useMensajeria } from '../contexto/MensajeriaContext'
import { usePedidos } from '../contexto/PedidosContext'
import { useToast } from '../contexto/ToastContext'
import { ImagenProducto } from '../componentes/ImagenProducto'

// Pantalla del vendedor: publicar productos y actualizar stock.
export function PanelVendedor() {
  const { productos, publicarProducto, actualizarStock, actualizarImagen } = useProductos()
  const { usuarioActual } = useSesion()
  const { consultasRecientes } = useConsultas()
  const { mensajes } = useMensajeria()
  const { pedidosPendientes } = usePedidos()
  const toast = useToast()

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [imagen, setImagen] = useState('') // foto subida (dataURL) para el nuevo producto
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
      imagen: imagen || undefined, // si subió foto la usa; si no, queda el emoji
    })

    // Limpiamos el formulario y mostramos confirmación.
    setNombre('')
    setDescripcion('')
    setCategoria('')
    setPrecio('')
    setStock('')
    setImagen('')
    setExito('Producto publicado correctamente.')
    toast.exito('Producto publicado correctamente 🎉')
  }

  // El vendedor elige una foto para el NUEVO producto (la comprime y la previsualiza).
  async function alElegirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    try {
      setImagen(await comprimirImagen(archivo))
    } catch {
      toast.error('No se pudo procesar la imagen.')
    }
  }

  // El vendedor cambia la foto de un producto YA publicado.
  async function alCambiarImagen(e: React.ChangeEvent<HTMLInputElement>, id: number) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    try {
      actualizarImagen(id, await comprimirImagen(archivo))
      toast.exito('Foto actualizada 📷')
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
        <h2>🤖 Sugerencias del asistente IA</h2>
        <div className="sugerencias-grid">
          <div className="sugerencia">
            <span className="sugerencia-num">{bajoStock.length}</span>
            <div>
              <strong>Bajo stock</strong>
              <p className="texto-tenue">
                {bajoStock.length === 0 ? 'Todo en orden.' : bajoStock.map((p) => p.nombre).join(', ')}
              </p>
            </div>
          </div>
          <div className="sugerencia">
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
          <div className="sugerencia">
            <span className="sugerencia-num">{mensajesPendientes.length}</span>
            <div>
              <strong>Mensajes pendientes</strong>
              <p className="texto-tenue">
                {mensajesPendientes.length === 0 ? 'Sin mensajes nuevos.' : 'Consultas por responder.'}
              </p>
            </div>
          </div>
          <div className="sugerencia">
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

            <label className="campo">
              <span>Imagen del producto</span>
              <input type="file" accept="image/*" onChange={alElegirImagen} />
            </label>
            {imagen && (
              <div className="preview-imagen">
                <img src={imagen} alt="Vista previa del producto" />
                <button
                  type="button"
                  className="btn btn-secundario btn-pequeno"
                  onClick={() => setImagen('')}
                >
                  Quitar foto
                </button>
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
        <section className="panel">
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

// Lee un archivo de imagen, lo redimensiona (máx. 400 px de lado) y lo devuelve
// como dataURL JPEG comprimido. Así la foto ocupa poco y cabe en localStorage
// (no hay backend donde guardarla).
function comprimirImagen(archivo: File, maxLado = 400, calidad = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'))
    lector.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
      img.onload = () => {
        let { width, height } = img
        // Escalamos manteniendo la proporción para que el lado mayor sea maxLado.
        if (width > height && width > maxLado) {
          height = Math.round((height * maxLado) / width)
          width = maxLado
        } else if (height >= width && height > maxLado) {
          width = Math.round((width * maxLado) / height)
          height = maxLado
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas no disponible'))
        // Fondo blanco: si la imagen es PNG con transparencia, al pasar a JPEG
        // las zonas transparentes quedan blancas (no negras).
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', calidad))
      }
      img.src = lector.result as string
    }
    lector.readAsDataURL(archivo)
  })
}
