import { useState } from 'react'
import { Link } from 'react-router-dom'
import { enviarReclamacion } from '../core/servicios/ReclamacionesService'
import { DATOS_NEGOCIO as NEGOCIO } from '../core/datos/negocio'

// Página pública del Libro de Reclamaciones (integrado, sin enlaces externos).
export function LibroReclamaciones() {
  const [tipo, setTipo] = useState<'reclamo' | 'queja'>('reclamo')
  const [f, setF] = useState({
    nombre: '', documento: '', telefono: '', correo: '', domicilio: '', esMenor: false,
    tipoBien: 'producto', monto: '', descripcionBien: '', detalle: '', pedido: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')

  // Actualiza un campo del formulario.
  function set(k: keyof typeof f, v: string | boolean) {
    setF((prev) => ({ ...prev, [k]: v }))
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!f.nombre.trim() || !f.detalle.trim()) {
      setError('Completa al menos tu nombre y el detalle de la reclamación.')
      return
    }
    setEnviando(true)
    try {
      const res = await enviarReclamacion({
        tipo,
        consumidorNombre: f.nombre.trim(),
        consumidorDocumento: f.documento.trim(),
        consumidorTelefono: f.telefono.trim(),
        consumidorCorreo: f.correo.trim(),
        consumidorDomicilio: f.domicilio.trim(),
        esMenor: f.esMenor,
        tipoBien: f.tipoBien as 'producto' | 'servicio',
        montoReclamado: f.monto ? Number(f.monto) : undefined,
        descripcionBien: f.descripcionBien.trim(),
        detalle: f.detalle.trim(),
        pedidoConsumidor: f.pedido.trim(),
      })
      setCodigo(res.codigo)
    } catch {
      setError('No se pudo registrar tu reclamación. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  // ----- Constancia tras enviar -----
  if (codigo) {
    return (
      <div className="pagina pagina-legal">
        <h1>Libro de Reclamaciones</h1>
        <div className="tarjeta" style={{ padding: '1.2rem' }}>
          <h2>✅ ¡Reclamación registrada!</h2>
          <p>
            Guarda tu código de constancia: <strong>{codigo}</strong>
          </p>
          <p className="texto-tenue">
            Conforme a ley, atenderemos tu {tipo} y te responderemos al correo que
            indicaste en un plazo máximo de 15 días hábiles.
          </p>
          <Link to="/" className="btn btn-primario">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina pagina-legal">
      <h1>Libro de Reclamaciones</h1>
      <p className="texto-tenue">
        Conforme al Código de Protección y Defensa del Consumidor (INDECOPI).
      </p>

      {/* Datos del proveedor */}
      <section className="tarjeta" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <h2>Datos del proveedor</h2>
        <p><strong>{NEGOCIO.nombre}</strong> · RUC {NEGOCIO.ruc}</p>
        <p className="texto-tenue">
          {NEGOCIO.direccion} · Tel: {NEGOCIO.telefono} · {NEGOCIO.correo}
        </p>
      </section>

      <form onSubmit={enviar}>
        {/* Tipo de solicitud */}
        <section className="tarjeta" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h2>Tipo de solicitud</h2>
          <label className="campo-radio">
            <input type="radio" name="tipo" checked={tipo === 'reclamo'} onChange={() => setTipo('reclamo')} />
            <span><strong>Reclamo</strong>: disconformidad con el producto o servicio.</span>
          </label>
          <label className="campo-radio">
            <input type="radio" name="tipo" checked={tipo === 'queja'} onChange={() => setTipo('queja')} />
            <span><strong>Queja</strong>: malestar por la atención recibida.</span>
          </label>
        </section>

        {/* Datos del consumidor */}
        <section className="tarjeta" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h2>Tus datos</h2>
          <label className="campo">
            <span>Nombre completo *</span>
            <input value={f.nombre} onChange={(e) => set('nombre', e.target.value)} />
          </label>
          <label className="campo">
            <span>Documento de identidad</span>
            <input value={f.documento} onChange={(e) => set('documento', e.target.value)} />
          </label>
          <label className="campo">
            <span>Teléfono</span>
            <input value={f.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </label>
          <label className="campo">
            <span>Correo electrónico</span>
            <input type="email" value={f.correo} onChange={(e) => set('correo', e.target.value)} />
          </label>
          <label className="campo">
            <span>Domicilio</span>
            <input value={f.domicilio} onChange={(e) => set('domicilio', e.target.value)} />
          </label>
          <label className="campo-radio">
            <input type="checkbox" checked={f.esMenor} onChange={(e) => set('esMenor', e.target.checked)} />
            <span>Soy menor de edad (requiere datos de un apoderado).</span>
          </label>
        </section>

        {/* Bien contratado */}
        <section className="tarjeta" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h2>Identificación del bien contratado</h2>
          <label className="campo">
            <span>Tipo</span>
            <select value={f.tipoBien} onChange={(e) => set('tipoBien', e.target.value)}>
              <option value="producto">Producto</option>
              <option value="servicio">Servicio</option>
            </select>
          </label>
          <label className="campo">
            <span>Monto reclamado (S/)</span>
            <input inputMode="decimal" value={f.monto} onChange={(e) => set('monto', e.target.value.replace(/[^0-9.]/g, ''))} />
          </label>
          <label className="campo">
            <span>Descripción del producto o servicio</span>
            <input value={f.descripcionBien} onChange={(e) => set('descripcionBien', e.target.value)} />
          </label>
        </section>

        {/* Detalle */}
        <section className="tarjeta" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <h2>Detalle de la reclamación</h2>
          <label className="campo">
            <span>Cuéntanos qué pasó *</span>
            <textarea rows={4} value={f.detalle} onChange={(e) => set('detalle', e.target.value)} />
          </label>
          <label className="campo">
            <span>¿Qué solicitas? (pedido del consumidor)</span>
            <textarea rows={3} value={f.pedido} onChange={(e) => set('pedido', e.target.value)} />
          </label>
        </section>

        {error && <p className="mensaje-error">{error}</p>}

        <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar reclamación'}
        </button>
      </form>

      <p style={{ marginTop: '1rem' }}>
        <Link to="/">← Volver al inicio</Link>
      </p>
    </div>
  )
}
