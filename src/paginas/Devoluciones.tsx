import { Link } from 'react-router-dom'
import { DATOS_NEGOCIO } from '../core/datos/negocio'

// Página pública de Política de Cambios y Devoluciones (requisito de la pasarela).
// Plantilla base razonable; para uso real conviene revisión legal.
export function Devoluciones() {
  return (
    <div className="pagina pagina-legal">
      <h1>Política de Cambios y Devoluciones</h1>
      <p className="texto-tenue">Última actualización: julio de 2026</p>

      <section>
        <h2>1. Derecho a cambio o devolución</h2>
        <p>
          En {DATOS_NEGOCIO.nombre} queremos que tu compra sea satisfactoria. Puedes
          solicitar el cambio o la devolución de un producto dentro de los <strong>7 días
          calendario</strong> siguientes a su recepción, conforme a la normativa de
          protección al consumidor vigente en Perú.
        </p>
      </section>

      <section>
        <h2>2. Condiciones</h2>
        <p>
          El producto debe estar sin uso, con su empaque original y los accesorios
          completos. Debes presentar el comprobante de compra o el número de pedido.
        </p>
      </section>

      <section>
        <h2>3. Productos que no admiten devolución</h2>
        <p>
          Por higiene o seguridad, algunos productos no son retornables una vez abiertos,
          salvo que presenten una falla de fábrica.
        </p>
      </section>

      <section>
        <h2>4. Productos con falla</h2>
        <p>
          Si el producto llega defectuoso o no corresponde a lo que compraste, cubrimos el
          cambio o la devolución sin costo para ti.
        </p>
      </section>

      <section>
        <h2>5. Reembolsos</h2>
        <p>
          Aprobada la devolución, el reembolso se realiza por el mismo medio de pago (o como
          saldo en tu billetera) en un plazo máximo de 7 días hábiles.
        </p>
      </section>

      <section>
        <h2>6. Cómo solicitarlo</h2>
        <p>
          Escríbenos a <strong>{DATOS_NEGOCIO.correo}</strong> o llámanos al{' '}
          <strong>{DATOS_NEGOCIO.telefono}</strong> indicando tu número de pedido. Si no
          quedas conforme, puedes usar nuestro{' '}
          <Link to="/libro-reclamaciones">Libro de Reclamaciones</Link>.
        </p>
      </section>

      <p>
        <Link to="/">← Volver al inicio</Link>
      </p>
    </div>
  )
}
