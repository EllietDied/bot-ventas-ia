import { Link } from 'react-router-dom'
import { DATOS_NEGOCIO } from '../core/datos/negocio'

// Página pública de Contacto: datos del comercio visibles (requisito de la pasarela).
export function Contacto() {
  return (
    <div className="pagina pagina-legal">
      <h1>Contacto</h1>
      <p className="texto-tenue">
        {DATOS_NEGOCIO.nombre} es una tienda en línea de productos tecnológicos. Estamos
        para ayudarte:
      </p>

      <section className="tarjeta" style={{ padding: '1rem' }}>
        <p><strong>Razón social:</strong> {DATOS_NEGOCIO.nombre}</p>
        <p><strong>RUC:</strong> {DATOS_NEGOCIO.ruc}</p>
        <p><strong>Dirección:</strong> {DATOS_NEGOCIO.direccion}</p>
        <p><strong>Teléfono / WhatsApp:</strong> {DATOS_NEGOCIO.telefono}</p>
        <p><strong>Correo:</strong> {DATOS_NEGOCIO.correo}</p>
        <p><strong>Horario de atención:</strong> {DATOS_NEGOCIO.horario}</p>
      </section>

      <p style={{ marginTop: '1rem' }}>
        ¿Tienes un inconveniente con una compra? Usa nuestro{' '}
        <Link to="/libro-reclamaciones">Libro de Reclamaciones</Link> o revisa la{' '}
        <Link to="/devoluciones">Política de Cambios y Devoluciones</Link>.
      </p>

      <p>
        <Link to="/">← Volver al inicio</Link>
      </p>
    </div>
  )
}
