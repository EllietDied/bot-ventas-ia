import { useEffect, useState } from 'react'
import { useSesion } from '../contexto/SesionContext'
import { useProductos } from '../contexto/ProductosContext'
import { useMensajeria } from '../contexto/MensajeriaContext'
import { esVendedor } from '../core/modelos/Vendedor'
import { Mensaje } from '../core/modelos/Mensaje'

// Pantalla de mensajería (RF10). Muestra una vista distinta según el rol.
export function Mensajes() {
  const { usuarioActual } = useSesion()
  if (!usuarioActual) return null
  return esVendedor(usuarioActual) ? <VistaVendedor /> : <VistaComprador />
}

// ---------- Vista del COMPRADOR: envía consultas y ve sus conversaciones ----------
function VistaComprador() {
  const { usuarioActual, usuarios } = useSesion()
  const { productos } = useProductos()
  const { mensajesDe, enviarMensaje, marcarLeido } = useMensajeria()
  const correo = usuarioActual!.correo

  const [idProducto, setIdProducto] = useState<number>(productos[0]?.id ?? 0)
  const [contenido, setContenido] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const mios = [...mensajesDe(correo)].reverse() // más recientes primero

  // Al abrir la pantalla, marcamos como leídos los mensajes recibidos.
  useEffect(() => {
    mensajesDe(correo)
      .filter((m) => m.destinatario === correo && !m.leido)
      .forEach((m) => marcarLeido(m.idMensaje))
  }, [])

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setExito('')

    // Validación: el mensaje no puede estar vacío.
    if (contenido.trim() === '') {
      setError('Escribe un mensaje antes de enviar.')
      return
    }
    const producto = productos.find((p) => p.id === idProducto)
    if (!producto) {
      setError('Selecciona un producto válido.')
      return
    }
    // Buscamos al vendedor dueño del producto.
    const vendedor = usuarios.find((u) => u.idUsuario === producto.idVendedor)
    if (!vendedor) {
      setError('Este producto no tiene un vendedor asignado.')
      return
    }

    enviarMensaje({
      remitente: correo,
      destinatario: vendedor.correo,
      idProducto: producto.id,
      nombreProducto: producto.nombre,
      contenido,
      tipoMensaje: 'consulta',
    })
    setContenido('')
    setExito('Consulta enviada al vendedor.')
  }

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Mensajes</h1>
        <p>Envía una consulta al vendedor sobre un producto.</p>
      </header>

      <section className="panel">
        <h2>Nueva consulta</h2>
        <form className="formulario" onSubmit={enviar}>
          <label className="campo">
            <span>Producto</span>
            <select value={idProducto} onChange={(e) => setIdProducto(Number(e.target.value))}>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Mensaje</span>
            <textarea
              rows={3}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe tu consulta..."
            />
          </label>

          {error && <p className="mensaje-error">{error}</p>}
          {exito && <p className="mensaje-exito">{exito}</p>}

          <button type="submit" className="btn btn-primario">
            Enviar consulta
          </button>
        </form>
      </section>

      <section>
        <h2>Mis conversaciones ({mios.length})</h2>
        {mios.length === 0 ? (
          <p className="texto-tenue">Aún no tienes mensajes.</p>
        ) : (
          <div className="msg-lista">
            {mios.map((m) => (
              <MensajeItem key={m.idMensaje} mensaje={m} correoActual={correo} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ---------- Vista del VENDEDOR: ve consultas recibidas y las responde ----------
function VistaVendedor() {
  const { usuarioActual } = useSesion()
  const { mensajes } = useMensajeria()
  const correo = usuarioActual!.correo

  // Consultas dirigidas a este vendedor (más recientes primero).
  const recibidas = [...mensajes]
    .filter((m) => m.destinatario === correo && m.tipoMensaje === 'consulta')
    .reverse()

  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Mensajes</h1>
        <p>Consultas recibidas de los compradores sobre tus productos.</p>
      </header>

      {recibidas.length === 0 ? (
        <div className="vacio">
          <p>No has recibido consultas todavía.</p>
        </div>
      ) : (
        <div className="msg-lista">
          {recibidas.map((m) => (
            <TarjetaConsulta key={m.idMensaje} consulta={m} />
          ))}
        </div>
      )}
    </div>
  )
}

// Tarjeta de una consulta con su formulario de respuesta (lado vendedor).
function TarjetaConsulta({ consulta }: { consulta: Mensaje }) {
  const { mensajes, enviarMensaje, marcarLeido } = useMensajeria()
  const [respuesta, setRespuesta] = useState('')
  const [error, setError] = useState('')

  // Respuestas ya enviadas a esta consulta (mismo producto y comprador).
  const respuestas = mensajes.filter(
    (m) =>
      m.tipoMensaje === 'respuesta' &&
      m.idProducto === consulta.idProducto &&
      m.destinatario === consulta.remitente &&
      m.remitente === consulta.destinatario,
  )

  function responder(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validación: la respuesta no puede estar vacía.
    if (respuesta.trim() === '') {
      setError('Escribe una respuesta antes de enviar.')
      return
    }

    enviarMensaje({
      remitente: consulta.destinatario, // el vendedor
      destinatario: consulta.remitente, // el comprador
      idProducto: consulta.idProducto,
      nombreProducto: consulta.nombreProducto,
      contenido: respuesta,
      tipoMensaje: 'respuesta',
    })
    marcarLeido(consulta.idMensaje) // la consulta queda leída al responder
    setRespuesta('')
  }

  return (
    <div className="msg-item recibido">
      <div className="msg-cabecera">
        <span className="msg-de">De: {consulta.remitente}</span>
        <span className="chip-mini">{consulta.nombreProducto}</span>
        {!consulta.leido && <span className="badge-no-leido">nuevo</span>}
      </div>
      <p className="msg-contenido">{consulta.contenido}</p>
      <div className="msg-meta texto-tenue">{consulta.fechaHora}</div>

      {respuestas.length > 0 && (
        <div className="msg-respuestas">
          {respuestas.map((r) => (
            <p key={r.idMensaje} className="msg-respuesta">
              ↳ {r.contenido} <span className="texto-tenue">({r.fechaHora})</span>
            </p>
          ))}
        </div>
      )}

      <form className="msg-form-responder" onSubmit={responder}>
        <input
          type="text"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          placeholder="Escribe una respuesta..."
        />
        <button type="submit" className="btn btn-primario btn-pequeno">
          Responder
        </button>
      </form>
      {error && <p className="mensaje-error">{error}</p>}
    </div>
  )
}

// Tarjeta de un mensaje en la lista del comprador.
function MensajeItem({ mensaje, correoActual }: { mensaje: Mensaje; correoActual: string }) {
  const enviadoPorMi = mensaje.remitente === correoActual
  return (
    <div className={enviadoPorMi ? 'msg-item enviado' : 'msg-item recibido'}>
      <div className="msg-cabecera">
        <span className="msg-de">{enviadoPorMi ? 'Tú → vendedor' : 'Vendedor → Tú'}</span>
        <span className="chip-mini">{mensaje.nombreProducto}</span>
      </div>
      <p className="msg-contenido">{mensaje.contenido}</p>
      <div className="msg-meta texto-tenue">
        {mensaje.tipoMensaje} · {mensaje.fechaHora} · {mensaje.leido ? 'leído' : 'no leído'}
      </div>
    </div>
  )
}
