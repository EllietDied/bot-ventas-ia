import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { useCarrito } from '../contexto/CarritoContext'
import { useConsultas } from '../contexto/ConsultasContext'
import { useSesion } from '../contexto/SesionContext'
import { useToast } from '../contexto/ToastContext'
import { TarjetaProducto } from '../componentes/TarjetaProducto'
import { Icono } from '../componentes/Icono'
import { ChatBotIA } from '../core/modelos/ChatBotIA'
import { Producto } from '../core/modelos/Producto'
import { esComprador } from '../core/modelos/Comprador'
import { BotonBuscarFoto } from '../componentes/BotonBuscarFoto'
import { type ResultadoBusquedaVisual } from '../core/servicios/BusquedaVisualService'

// Instancia del bot para generar recomendaciones.
const bot = new ChatBotIA()

// Pantalla principal: catálogo de productos tecnológicos.
export function Catalogo() {
  const { productos, buscar, categorias } = useProductos()
  const { agregarAlCarrito } = useCarrito()
  const { registrarConsulta, categoriasConsultadas } = useConsultas()
  const { usuarioActual } = useSesion()
  const toast = useToast()
  const navegar = useNavigate()

  const [termino, setTermino] = useState('')
  const [categoria, setCategoria] = useState('')
  const [orden, setOrden] = useState('relevancia') // cómo se ordenan los productos
  const [foto, setFoto] = useState<ResultadoBusquedaVisual | null>(null)

  // Al identificar una foto, guardamos su resultado (para mostrar los similares).
  function manejarFoto(r: ResultadoBusquedaVisual) {
    setFoto(r)
    if (r.termino) registrarConsulta(r.termino, '')
    if (r.productos.length > 0) {
      toast.exito(`Encontré ${r.productos.length} producto(s) similar(es) a tu foto.`)
    } else {
      toast.info('No pude identificar el producto. Intenta con otra foto más clara.')
    }
  }

  // Un visitante (sin sesión) puede MIRAR el catálogo, pero no comprar.
  const esVisitante = !usuarioActual
  // El comprador puede agregar al carrito; el vendedor solo observa.
  const puedeComprar = usuarioActual ? esComprador(usuarioActual) : false
  // Mostramos el botón también al visitante: al pulsarlo lo enviamos a login.
  const mostrarBoton = puedeComprar || esVisitante

  // Aplicamos el buscador y luego el filtro por categoría.
  let resultados: Producto[] = buscar(termino)
  if (categoria !== '') {
    resultados = resultados.filter((p) => p.categoria === categoria)
  }
  // Ordenamiento elegido por el usuario (relevancia = orden original).
  if (orden === 'precio-asc') resultados = [...resultados].sort((a, b) => a.precio - b.precio)
  else if (orden === 'precio-desc') resultados = [...resultados].sort((a, b) => b.precio - a.precio)
  else if (orden === 'nombre')
    resultados = [...resultados].sort((a, b) => a.nombre.localeCompare(b.nombre))

  // Cuántos productos hay en cada categoría (para mostrarlo en los filtros).
  const conteoCategoria = (cat: string) => productos.filter((p) => p.categoria === cat).length

  // Productos recomendados según las categorías consultadas.
  const recomendados = bot.recomendarProducto(categoriasConsultadas, productos)

  // Al buscar, registramos la consulta (para las recomendaciones).
  function buscarAhora(e: React.FormEvent) {
    e.preventDefault()
    if (termino.trim() === '') return
    const categoriaDetectada =
      categorias.find((c) => c.toLowerCase().includes(termino.toLowerCase())) ?? ''
    registrarConsulta(termino, categoriaDetectada)
  }

  // Al agregar, también registramos la categoría como consulta.
  function agregar(producto: Producto) {
    agregarAlCarrito(producto)
    registrarConsulta(producto.nombre, producto.categoria)
    toast.exito(`${producto.nombre} agregado al carrito`)
  }

  // Acción del botón: el comprador agrega al carrito; al visitante lo enviamos a
  // iniciar sesión (para comprar primero hay que tener una cuenta).
  function intentarComprar(producto: Producto) {
    if (esVisitante) {
      toast.info('Inicia sesión para comprar.')
      navegar('/login')
      return
    }
    agregar(producto)
  }

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Explorar catálogo</h1>
        <p>¿Prefieres buscar por tu cuenta? También puedes pedirle recomendaciones al Asistente IA en el inicio.</p>
      </header>

      {/* Buscador */}
      <form className="buscador" onSubmit={buscarAhora}>
        <div className="buscador-campo">
          <span className="buscador-lupa" aria-hidden="true">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar producto o categoría..."
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
          />
          {termino && (
            <button
              type="button"
              className="buscador-limpiar"
              aria-label="Limpiar búsqueda"
              onClick={() => setTermino('')}
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primario">
          Buscar
        </button>
      </form>

      {/* Buscar por foto */}
      <div className="buscador-foto">
        <BotonBuscarFoto onResultado={manejarFoto} className="btn btn-secundario" />
        <span className="texto-tenue">Toma o sube una foto y te muestro productos similares.</span>
      </div>

      {/* Filtro por categoría */}
      <div className="filtros">
        <button
          className={categoria === '' ? 'chip activo' : 'chip'}
          onClick={() => setCategoria('')}
        >
          Todas
        </button>
        {categorias.map((c) => (
          <button
            key={c}
            className={categoria === c ? 'chip activo' : 'chip'}
            onClick={() => setCategoria(c)}
          >
            {c} <span className="chip-conteo">{conteoCategoria(c)}</span>
          </button>
        ))}
      </div>

      {/* Resultados de la búsqueda por foto */}
      {foto && (
        <section className="seccion-foto">
          <div className="foto-aviso">
            <span>
              <Icono nombre="camara" size={16} /> Resultados de tu foto
              {foto.etiqueta ? `: ${foto.etiqueta}` : ''}
            </span>
            <button className="chip" onClick={() => setFoto(null)}>
              ✕ Limpiar
            </button>
          </div>
          {foto.productos.length === 0 ? (
            <p className="texto-tenue">
              No pude identificar el producto. Prueba con otra foto más clara o usa el buscador.
            </p>
          ) : (
            <div className="grid-productos">
              {foto.productos.map((p) => (
                <TarjetaProducto
                  key={p.id}
                  producto={p}
                  alAgregar={mostrarBoton ? intentarComprar : undefined}
                  textoBoton={esVisitante ? 'Inicia sesión para comprar' : undefined}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recomendaciones del bot */}
      {recomendados.length > 0 && (
        <section className="seccion-recomendados">
          <h2>
            <Icono nombre="ia" size={18} /> Recomendado para ti
          </h2>
          <p className="texto-tenue">Basado en las categorías que has consultado.</p>
          <div className="grid-productos">
            {recomendados.map((p) => (
              <TarjetaProducto
                key={p.id}
                producto={p}
                alAgregar={mostrarBoton ? intentarComprar : undefined}
                textoBoton={esVisitante ? 'Inicia sesión para comprar' : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* Resultados del catálogo */}
      <section>
        <div className="catalogo-seccion-top">
          <h2>
            Todos los productos <span className="texto-tenue">({resultados.length})</span>
          </h2>
          <label className="catalogo-orden">
            <span>Ordenar:</span>
            <select value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="nombre">Nombre (A-Z)</option>
            </select>
          </label>
        </div>
        {resultados.length === 0 ? (
          <p className="texto-tenue">No se encontraron productos para tu búsqueda.</p>
        ) : (
          <div className="grid-productos">
            {resultados.map((p) => (
              <TarjetaProducto
                key={p.id}
                producto={p}
                alAgregar={mostrarBoton ? intentarComprar : undefined}
                textoBoton={esVisitante ? 'Inicia sesión para comprar' : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
