import { useState } from 'react'
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

// Instancia del bot para generar recomendaciones.
const bot = new ChatBotIA()

// Pantalla principal: catálogo de productos tecnológicos.
export function Catalogo() {
  const { productos, buscar, categorias } = useProductos()
  const { agregarAlCarrito } = useCarrito()
  const { registrarConsulta, categoriasConsultadas } = useConsultas()
  const { usuarioActual } = useSesion()
  const toast = useToast()

  const [termino, setTermino] = useState('')
  const [categoria, setCategoria] = useState('')

  // El comprador puede agregar al carrito; el vendedor solo observa.
  const puedeComprar = usuarioActual ? esComprador(usuarioActual) : false

  // Aplicamos el buscador y luego el filtro por categoría.
  let resultados: Producto[] = buscar(termino)
  if (categoria !== '') {
    resultados = resultados.filter((p) => p.categoria === categoria)
  }

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

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Explorar catálogo</h1>
        <p>¿Prefieres buscar por tu cuenta? También puedes pedirle recomendaciones al Asistente IA en el inicio.</p>
      </header>

      {/* Buscador */}
      <form className="buscador" onSubmit={buscarAhora}>
        <input
          type="text"
          placeholder="Buscar producto o categoría..."
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
        />
        <button type="submit" className="btn btn-primario">
          Buscar
        </button>
      </form>

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
            {c}
          </button>
        ))}
      </div>

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
                alAgregar={puedeComprar ? agregar : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* Resultados del catálogo */}
      <section>
        <h2>Todos los productos</h2>
        {resultados.length === 0 ? (
          <p className="texto-tenue">No se encontraron productos para tu búsqueda.</p>
        ) : (
          <div className="grid-productos">
            {resultados.map((p) => (
              <TarjetaProducto
                key={p.id}
                producto={p}
                alAgregar={puedeComprar ? agregar : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
