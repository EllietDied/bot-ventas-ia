import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { useCarrito } from '../contexto/CarritoContext'
import { useConsultas } from '../contexto/ConsultasContext'
import { useSesion } from '../contexto/SesionContext'
import { esComprador } from '../core/modelos/Comprador'
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
}

const BIENVENIDA: MensajeAsistente = {
  id: 'A-0',
  emisor: 'bot',
  texto:
    '¡Hola! Soy tu Asistente IA de Ventas 🤖. Cuéntame qué buscas (por categoría, uso o presupuesto) y te recomendaré las mejores opciones. También puedes usar los botones rápidos de abajo.',
}

const BOTONES_RAPIDOS = [
  'Recomiéndame una laptop',
  'Busco algo económico',
  'Armar una PC básica',
  'Ver productos gamer',
]

// PANTALLA PRINCIPAL: el Asistente IA es el centro de la aplicación.
export function Asistente() {
  const { productos } = useProductos()
  const { agregarAlCarrito, cantidadTotal } = useCarrito()
  const { registrarConsulta, consultasRecientes, categoriasConsultadas } = useConsultas()
  const { usuarioActual } = useSesion()
  const navegar = useNavigate()

  const puedeComprar = usuarioActual ? esComprador(usuarioActual) : false

  const [mensajes, setMensajes] = useState<MensajeAsistente[]>(() =>
    cargar<MensajeAsistente[]>('asistente_chat', [BIENVENIDA]),
  )
  const [texto, setTexto] = useState('')
  const [comparar, setComparar] = useState<Producto[]>([])
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    guardar('asistente_chat', mensajes)
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  function agregarMensaje(m: MensajeAsistente) {
    setMensajes((prev) => [...prev, m])
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

    // 3) Respuesta del asistente + productos recomendados.
    const respuesta = bot.responderConsulta(limpio, productos)
    const recomendados = limpio.toLowerCase().includes('gracias')
      ? []
      : bot.recomendarPorConsulta(limpio, productos, categoriasConsultadas)
    agregarMensaje({
      id: idUnico(),
      emisor: 'bot',
      texto: respuesta,
      productos: recomendados,
    })
    setTexto('')
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
        <h1>🤖 Asistente IA de Ventas</h1>
        <p>Tu asistente te guía desde la consulta hasta el pedido.</p>
      </header>

      <div className="asistente-layout">
        {/* ===== Chat principal (protagonista) ===== */}
        <div className="asistente-chat">
          <div className="asistente-mensajes">
            {mensajes.map((m) => (
              <div key={m.id} className="asistente-fila">
                <div className={m.emisor === 'bot' ? 'burbuja bot' : 'burbuja usuario'}>{m.texto}</div>

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
              <button key={b} className="chip" onClick={() => enviarTexto(b)}>
                {b}
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
        <span className={agotado ? 'tarjeta-stock agotado' : 'tarjeta-stock'}>
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
