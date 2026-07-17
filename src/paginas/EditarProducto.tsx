import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { useSesion } from '../contexto/SesionContext'
import { useToast } from '../contexto/ToastContext'
import { comprimirImagen } from '../util/imagen'
import { CATEGORIAS } from '../core/datos/categorias'
import { subirImagenProducto } from '../core/servicios/ProductosService'
import { usarSupabase } from '../core/datos/supabase'

// Página para EDITAR un producto ya publicado (solo su vendedor dueño).
// Formulario completo, pre-rellenado; guarda todos los campos a la vez.
export function EditarProducto() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { productos, editarProducto } = useProductos()
  const { usuarioActual } = useSesion()
  const toast = useToast()

  const producto = productos.find((p) => String(p.id) === String(id))

  const [nombre, setNombre] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [material, setMaterial] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [caracteristicas, setCaracteristicas] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [imagenes, setImagenes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Rellenamos el formulario cuando tenemos el producto (o cambia de id).
  useEffect(() => {
    if (!producto) return
    setNombre(producto.nombre)
    setMarca(producto.marca ?? '')
    setModelo(producto.modelo ?? '')
    setMaterial(producto.material ?? '')
    setDescripcion(producto.descripcion ?? '')
    setCaracteristicas(producto.caracteristicas ?? '')
    setCategoria(producto.categoria ?? '')
    setPrecio(String(producto.precio ?? ''))
    setStock(String(producto.stock ?? ''))
    const fotos =
      producto.imagenes && producto.imagenes.length > 0
        ? producto.imagenes
        : producto.imagen && /^(https?:|data:)/.test(producto.imagen)
          ? [producto.imagen]
          : []
    setImagenes(fotos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto?.id])

  if (!producto) {
    return (
      <div className="pagina">
        <p className="texto-tenue">No encontramos ese producto.</p>
        <button className="btn btn-secundario" onClick={() => navegar('/vendedor')}>
          ← Volver al panel
        </button>
      </div>
    )
  }

  // Seguridad: solo el vendedor dueño puede editarlo.
  if (producto.idVendedor && producto.idVendedor !== usuarioActual?.idUsuario) {
    return (
      <div className="pagina">
        <p className="texto-tenue">Este producto no es tuyo, no puedes editarlo.</p>
        <button className="btn btn-secundario" onClick={() => navegar('/vendedor')}>
          ← Volver al panel
        </button>
      </div>
    )
  }

  async function alElegirFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? [])
    if (archivos.length === 0) return
    try {
      const nuevas = await Promise.all(archivos.map((a) => comprimirImagen(a, 768)))
      setImagenes((prev) => [...prev, ...nuevas].slice(0, 6))
    } catch {
      toast.error('No se pudo procesar alguna imagen.')
    }
    e.target.value = ''
  }

  function quitarFoto(indice: number) {
    setImagenes((prev) => prev.filter((_, i) => i !== indice))
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) return setError('El nombre es obligatorio.')
    if (!categoria) return setError('Elige una categoría.')
    const precioNum = Number(precio)
    const stockNum = Number(stock)
    if (!Number.isFinite(precioNum) || precioNum <= 0) return setError('El precio debe ser mayor a 0.')
    if (!Number.isInteger(stockNum) || stockNum < 0) return setError('El stock no puede ser negativo.')

    setGuardando(true)
    // Subimos las fotos NUEVAS (dataURL) a Storage; las que ya son URL se dejan.
    const imagenesFinal: string[] = []
    for (const foto of imagenes) {
      if (usarSupabase() && foto.startsWith('data:')) {
        const url = await subirImagenProducto(foto)
        imagenesFinal.push(url || foto)
      } else {
        imagenesFinal.push(foto)
      }
    }

    editarProducto(producto!.id, {
      nombre: nombre.trim(),
      marca: marca.trim() || undefined,
      modelo: modelo.trim() || undefined,
      material: material.trim() || undefined,
      descripcion,
      caracteristicas: caracteristicas.trim() || undefined,
      categoria,
      precio: precioNum,
      stock: stockNum,
      imagen: imagenesFinal[0] || '📦',
      imagenes: imagenesFinal,
    })
    setGuardando(false)
    toast.exito('Producto actualizado')
    navegar('/vendedor')
  }

  return (
    <div className="pagina">
      <button className="btn btn-secundario btn-pequeno" onClick={() => navegar('/vendedor')}>
        ← Volver al panel
      </button>

      <section className="panel" style={{ marginTop: '1rem', maxWidth: '620px' }}>
        <h1>Editar producto</h1>
        <form className="formulario" onSubmit={guardar}>
          <label className="campo">
            <span>Nombre *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <div className="form-grid">
            <label className="campo">
              <span>Marca</span>
              <input value={marca} onChange={(e) => setMarca(e.target.value)} />
            </label>
            <label className="campo">
              <span>Modelo</span>
              <input value={modelo} onChange={(e) => setModelo(e.target.value)} />
            </label>
          </div>
          <label className="campo">
            <span>Material</span>
            <input value={material} onChange={(e) => setMaterial(e.target.value)} />
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
            <span>Fotos del producto (máx. 6)</span>
            <input type="file" accept="image/*" multiple onChange={alElegirFotos} />
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
                    onClick={() => quitarFoto(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="mensaje-error">{error}</p>}

          <div className="detalle-acciones">
            <button type="submit" className="btn btn-primario" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button type="button" className="btn btn-secundario" onClick={() => navegar('/vendedor')}>
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
