import { useEffect, useRef, useState } from 'react'
import { useProductos } from '../contexto/ProductosContext'
import { useConsultas } from '../contexto/ConsultasContext'
import { ChatBotIA } from '../core/modelos/ChatBotIA'
import { MensajeBot } from '../core/modelos/MensajeBot'
import { cargar, guardar } from '../core/datos/almacenamiento'

// Instancia del bot (IA simulada).
const bot = new ChatBotIA()

// Mensaje de bienvenida inicial.
const MENSAJE_INICIAL: MensajeBot = {
  idMensaje: 'M-0',
  emisor: 'bot',
  contenido: '¡Hola! Soy tu asistente de ventas. Pregúntame por precios, stock o categorías.',
  fechaHora: '',
}

// Pantalla del chatbot.
export function Chat() {
  const { productos, categorias } = useProductos()
  const { registrarConsulta, consultasRecientes } = useConsultas()

  const [mensajes, setMensajes] = useState<MensajeBot[]>(() =>
    cargar<MensajeBot[]>('mensajes', [MENSAJE_INICIAL]),
  )
  const [texto, setTexto] = useState('')
  const finRef = useRef<HTMLDivElement>(null)

  // Guardamos los mensajes y bajamos el scroll al último.
  useEffect(() => {
    guardar('mensajes', mensajes)
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const consulta = texto.trim()
    if (consulta === '') return

    // 1) Mensaje del usuario.
    const mensajeUsuario: MensajeBot = {
      idMensaje: 'M-' + Date.now(),
      emisor: 'usuario',
      contenido: consulta,
      fechaHora: new Date().toLocaleString(),
    }

    // 2) Respuesta del bot (IA simulada).
    const respuesta = bot.responderConsulta(consulta, productos)
    const mensajeBot: MensajeBot = {
      idMensaje: 'M-' + (Date.now() + 1),
      emisor: 'bot',
      contenido: respuesta,
      fechaHora: new Date().toLocaleString(),
    }

    setMensajes((prev) => [...prev, mensajeUsuario, mensajeBot])

    // 3) Registramos la consulta en la PILA (para recomendaciones).
    registrarConsulta(consulta, detectarCategoria(consulta))
    setTexto('')
  }

  // Intenta deducir la categoría a partir del texto de la consulta.
  function detectarCategoria(consulta: string): string {
    const t = consulta.toLowerCase()
    const productoMencionado = productos.find((p) => t.includes(p.nombre.toLowerCase()))
    if (productoMencionado) return productoMencionado.categoria
    return categorias.find((c) => t.includes(c.toLowerCase())) ?? ''
  }

  return (
    <div className="pagina">
      <h1>Chatbot de ventas</h1>

      <div className="chat-layout">
        {/* Ventana de chat */}
        <div className="chat-ventana">
          <div className="chat-mensajes">
            {mensajes.map((m) => (
              <div
                key={m.idMensaje}
                className={m.emisor === 'bot' ? 'burbuja bot' : 'burbuja usuario'}
              >
                {m.contenido}
              </div>
            ))}
            <div ref={finRef} />
          </div>

          <form className="chat-entrada" onSubmit={enviar}>
            <input
              type="text"
              placeholder="Escribe tu consulta..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button type="submit" className="btn btn-primario">
              Enviar
            </button>
          </form>
        </div>

        {/* PILA LIFO: consultas recientes */}
        <aside className="panel">
          <h2>🧾 Consultas recientes</h2>
          <p className="texto-tenue">Pila LIFO: la última consulta aparece primero.</p>
          {consultasRecientes.length === 0 ? (
            <p className="texto-tenue">Aún no hay consultas.</p>
          ) : (
            <ul className="lista-consultas">
              {consultasRecientes.map((c, i) => (
                <li key={i}>
                  <span>{c.termino}</span>
                  {c.categoria && <span className="chip-mini">{c.categoria}</span>}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
