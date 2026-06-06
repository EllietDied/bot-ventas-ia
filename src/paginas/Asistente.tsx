import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { useCarrito } from '../contexto/CarritoContext'
import { useConsultas } from '../contexto/ConsultasContext'
import { useSesion } from '../contexto/SesionContext'
import { esComprador } from '../core/modelos/Comprador'
import { LogoUSS } from '../componentes/LogoUSS'
import { ChatBotIA } from '../core/modelos/ChatBotIA'
import { Producto } from '../core/modelos/Producto'
import { cargar, guardar } from '../core/datos/almacenamiento'

// Instancia del asistente (IA simulada).
const bot = new ChatBotIA()

// Genera un id único para cada mensaje (evita claves repetidas en React).
let contadorMensaje = 0
function idUnico(): string {
  contadorMensaje += 1
  return 'M-' + Date.now() + '-' + contadorMensaje
}

// Un mensaje del asistente puede ser solo texto, traer productos
// recomendados (tarjetas) o una tabla de comparación.
interface MensajeAsistente {
  id: string
  emisor: 'usuario' | 'bot'
  texto: string
  productos?: Producto[]
  comparacion?: Producto[]
  pensando?: boolean // mientras el asistente "procesa" la consulta
}

// Botones rápidos: lo que se muestra (label) y lo que se le envía al bot (query).
const BOTONES_RAPIDOS: { label: string; query: string }[] = [
  { label: '🎮 Quiero algo gamer', query: 'Quiero algo gamer' },
  { label: '💰 Busco algo económico', query: 'Busco algo económico' },
  { label: '🖥️ Armar una PC básica', query: 'Armar una PC básica' },
  { label: '🔥 Ver ofertas', query: 'Ver ofertas económicas' },
]

// PANTALLA PRINCIPAL: el Asistente IA es el centro de la aplicación.
export function Asistente() {
  const { productos } = useProductos()
  const { agregarAlCarrito, cantidadTotal } = useCarrito()
  const { registrarConsulta, consultasRecientes, categoriasConsultadas } = useConsultas()
  const { usuarioActual } = useSesion()
  const navegar = useNavigate()

  const puedeComprar = usuarioActual ? esComprador(usuarioActual) : false

  // Saludo personalizado con el nombre del usuario.
  const primerNombre = usuarioActual ? usuarioActual.nombre.split(' ')[0] : ''
  const bienvenida: MensajeAsistente = {
    id: 'A-0',
    emisor: 'bot',
    texto: `¡Hola${primerNombre ? ', ' + primerNombre : ''}! 👋 Bienvenido a IA InkaShop 🤖. Soy tu asistente de ventas: cuéntame qué buscas (por categoría, uso o presupuesto) y te recomendaré las mejores opciones. También puedes usar los botones rápidos de abajo.`,
  }

  const [mensajes, setMensajes] = useState<MensajeAsistente[]>(() =>
    cargar<MensajeAsistente[]>('asistente_chat', [bienvenida]),
  )
  const [texto, setTexto] = useState('')
  const [comparar, setComparar] = useState<Producto[]>([])
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // No guardamos los mensajes "pensando" (son temporales).
    guardar('asistente_chat', mensajes.filter((m) => !m.pensando))
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  function agregarMensaje(m: MensajeAsistente) {
    setMensajes((prev) => [...prev, m])
  }

  // Reemplaza el contenido de un mensaje ya existente (por su id).
  function actualizarMensaje(id: string, cambios: Partial<MensajeAsistente>) {
    setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, ...cambios } : m)))
  }

  // Intenta deducir la categoría a partir del texto (para el historial / recomendaciones).
  function detectarCategoria(consulta: string): string {
    const t = consulta.toLowerCase()
    const p = productos.find((pr) => t.includes(pr.nombre.toLowerCase()))
    if (p) return p.categoria
    const categorias = [...new Set(productos.map((pr) => pr.categoria))]
    return categorias.find((c) => t.includes(c.toLowerCase())) ?? ''
  }

  // Envía un texto al asistente (desde el input o desde un botón rápido).
  function enviarTexto(consulta: string) {
    const limpio = consulta.trim()
    if (limpio === '') return

    // 1) Mensaje del usuario.
    agregarMensaje({ id: idUnico(), emisor: 'usuario', texto: limpio })

    // 2) Registramos la consulta en la PILA LIFO (para historial y recomendaciones).
    registrarConsulta(limpio, detectarCategoria(limpio))
    setTexto('')

    // 3) Efecto "IA trabajando": mostramos pasos antes de la respuesta final.
    const idBot = idUnico()
    agregarMensaje({ id: idBot, emisor: 'bot', texto: 'Analizando tu consulta', pensando: true })

    // Paso intermedio: "buscando productos".
    setTimeout(() => {
      actualizarMensaje(idBot, { texto: 'Buscando productos relacionados' })
    }, 700)

    // Respuesta final: texto del bot + tarjetas de productos recomendados.
    setTimeout(() => {
      const respuesta = bot.responderConsulta(limpio, productos)
      const recomendados = limpio.toLowerCase().includes('gracias')
        ? []
        : bot.recomendarPorConsulta(limpio, productos, categoriasConsultadas)
      actualizarMensaje(idBot, { texto: respuesta, productos: recomendados, pensando: false })
    }, 1600)
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    enviarTexto(texto)
  }

  // ---- Acciones de las tarjetas de producto dentro del chat ----
  function verDetalle(p: Producto) {
    agregarMensaje({
      id: idUnico(),
      emisor: 'bot',
      texto: `📋 ${p.nombre} — ${p.categoria}\n${p.descripcion}\nPrecio: S/ ${p.precio.toFixed(
        2,
      )} · Stock: ${p.stock}`,
    })
  }

  function agregar(p: Producto) {
    agregarAlCarrito(p)
    registrarConsulta(p.nombre, p.categoria)
    agregarMensaje({
      id: idUnico(),
      emisor: 'bot',
      texto: `✅ Agregué ${p.nombre} a tu carrito. ¿Deseas algo más o pasamos a pagar?`,
    })
  }

  function compararProducto(p: Producto) {
    setComparar((prev) => {
      if (prev.find((x) => x.id === p.id)) return prev
      const nuevo = [...prev, p].slice(-3) // comparamos hasta 3
      if (nuevo.length >= 2) {
        agregarMensaje({
          id: idUnico(),
          emisor: 'bot',
          texto: 'Aquí tienes la comparación:',
          comparacion: nuevo,
        })
      } else {
        agregarMensaje({
          id: idUnico(),
          emisor: 'bot',
          texto: `Agregué ${p.nombre} para comparar. Elige otro producto para verlos lado a lado.`,
        })
      }
      return nuevo
    })
  }

  function consultarVendedor(p: Producto) {
    // Vamos a Mensajes con el producto preseleccionado.
    navegar('/mensajes', { state: { idProducto: p.id } })
  }

  return (
    <div className="pagina">
      <header className="asistente-cabecera">
        <h1>🤖 IA InkaShop</h1>
        <p>Compra con respaldo, vende con innovación.</p>
      </header>

      {/* Bloque institucional discreto */}
      <div className="bloque-institucional">
        <LogoUSS size="small" />
        <span>Universidad Señor de Sipán · Taller de Aplicaciones</span>
      </div>

      <div className="asistente-layout">
        {/* ===== Chat principal (protagonista) ===== */}
        <div className="asistente-chat">
          <div className="asistente-mensajes">
            {mensajes.map((m) => (
              <div key={m.id} className="asistente-fila">
                <div
                  className={
                    m.emisor === 'bot'
                      ? 'burbuja bot' + (m.pensando ? ' pensando' : '')
                      : 'burbuja usuario'
                  }
                >
                  {m.texto}
                  {m.pensando && (
                    <span className="puntos-pensando">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  )}
                </div>

                {/* Productos recomendados dentro del chat */}
                {m.productos && m.productos.length > 0 && (
                  <div className="chat-recomendaciones">
                    {m.productos.map((p) => (
                      <TarjetaChat
                        key={p.id}
                        producto={p}
                        puedeComprar={puedeComprar}
                        onDetalle={() => verDetalle(p)}
                        onAgregar={() => agregar(p)}
                        onComparar={() => compararProducto(p)}
                        onConsultar={() => consultarVendedor(p)}
                      />
                    ))}
                  </div>
                )}

                {/* Tabla de comparación */}
                {m.comparacion && <TablaComparacion productos={m.comparacion} />}
              </div>
            ))}
            <div ref={finRef} />
          </div>

          {/* Botones rápidos */}
          <div className="asistente-rapidos">
            {BOTONES_RAPIDOS.map((b) => (
              <button key={b.label} className="chip" onClick={() => enviarTexto(b.query)}>
                {b.label}
              </button>
            ))}
            {puedeComprar && (
              <button className="chip" onClick={() => navegar('/carrito')}>
                🛒 Ver mi carrito{cantidadTotal > 0 ? ` (${cantidadTotal})` : ''}
              </button>
            )}
          </div>

          {/* Entrada de texto */}
          <form className="asistente-entrada" onSubmit={enviar}>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe lo que buscas... (ej. “laptop hasta 2000”)"
            />
            <button type="submit" className="btn btn-primario">
              Enviar
            </button>
          </form>
        </div>

        {/* ===== Panel lateral: consultas recientes (Pila LIFO) ===== */}
        <aside className="asistente-panel">
          <h2>🧾 Consultas recientes</h2>
          <p className="texto-tenue">Pila LIFO: la última consulta aparece primero.</p>
          {consultasRecientes.length === 0 ? (
            <p className="texto-tenue">Aún no hay consultas.</p>
          ) : (
            <ul className="lista-consultas">
              {consultasRecientes.slice(0, 8).map((c, i) => (
                <li key={i}>
                  <span>{c.termino}</span>
                  {c.categoria && <span className="chip-mini">{c.categoria}</span>}
                </li>
              ))}
            </ul>
          )}
          <div className="asistente-tip">
            <strong>💡 Tip:</strong> dime tu presupuesto (ej. “laptop hasta 2000”) y filtro por precio.
          </div>
        </aside>
      </div>
    </div>
  )
}

// Tarjeta de producto mostrada dentro del chat, con acciones del asistente.
function TarjetaChat({
  producto,
  puedeComprar,
  onDetalle,
  onAgregar,
  onComparar,
  onConsultar,
}: {
  producto: Producto
  puedeComprar: boolean
  onDetalle: () => void
  onAgregar: () => void
  onComparar: () => void
  onConsultar: () => void
}) {
  const agotado = producto.stock <= 0
  const bajoStock = producto.stock > 0 && producto.stock <= 5
  return (
    <div className="tarjeta-chat">
      <div className="tarjeta-chat-top">
        <span className="tarjeta-chat-img">{producto.imagen}</span>
        <div>
          <div className="tarjeta-chat-nombre">{producto.nombre}</div>
          <div className="tarjeta-chat-cat">{producto.categoria}</div>
        </div>
      </div>
      <div className="tarjeta-chat-precio">
        S/ {producto.precio.toFixed(2)}{' '}
        <span
          className={
            agotado ? 'tarjeta-stock agotado' : bajoStock ? 'tarjeta-stock bajo' : 'tarjeta-stock'
          }
        >
          {agotado ? 'Agotado' : `Stock: ${producto.stock}`}
        </span>
      </div>
      <div className="tarjeta-chat-acciones">
        <button className="btn-mini" onClick={onDetalle}>
          Ver detalle
        </button>
        {puedeComprar && (
          <button className="btn-mini primario" onClick={onAgregar} disabled={agotado}>
            Agregar
          </button>
        )}
        <button className="btn-mini" onClick={onComparar}>
          Comparar
        </button>
        {puedeComprar && (
          <button className="btn-mini" onClick={onConsultar}>
            Consultar vendedor
          </button>
        )}
      </div>
    </div>
  )
}

// Tabla comparativa de productos.
function TablaComparacion({ productos }: { productos: Producto[] }) {
  return (
    <div className="chat-comparacion tabla-scroll">
      <table className="tabla">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.categoria}</td>
              <td>S/ {p.precio.toFixed(2)}</td>
              <td>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
