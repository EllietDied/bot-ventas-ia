import { Link } from 'react-router-dom'

// Página pública de Términos y Condiciones (requisito de la pasarela de pagos).
// Es solo contenido (texto), sin lógica. Plantilla base: para uso real conviene
// que un abogado la revise y la adapte.
export function Terminos() {
  return (
    <div className="pagina pagina-legal">
      <h1>Términos y Condiciones</h1>
      <p className="texto-tenue">Última actualización: junio de 2026</p>

      <section>
        <h2>1. Quiénes somos</h2>
        <p>
          IA InkaShop es una tienda en línea de productos tecnológicos que cuenta con un asistente
          de ventas con inteligencia artificial. Al usar la plataforma, aceptas estos Términos y
          Condiciones.
        </p>
      </section>

      <section>
        <h2>2. Cuenta de usuario</h2>
        <p>
          Para comprar necesitas registrarte con datos verídicos (nombre, correo, documento de
          identidad, teléfono y dirección). Eres responsable de mantener tu contraseña segura y de
          la actividad realizada con tu cuenta.
        </p>
      </section>

      <section>
        <h2>3. Productos y precios</h2>
        <p>
          Los precios se muestran en soles peruanos (S/) e incluyen los impuestos aplicables. Nos
          reservamos el derecho de actualizar precios y disponibilidad. Si un producto aparece sin
          stock, no podrá comprarse hasta su reposición.
        </p>
      </section>

      <section>
        <h2>4. Pagos</h2>
        <p>
          Los pagos se procesan a través de la pasarela <strong>Culqi</strong> (tarjetas, Yape y
          PagoEfectivo) y/o mediante el <strong>saldo de tu billetera</strong> dentro de la
          aplicación. No almacenamos los datos de tu tarjeta: los gestiona de forma segura el
          proveedor de pagos. El saldo de la billetera solo puede usarse para comprar dentro de IA
          InkaShop y no es transferible ni canjeable por dinero en efectivo.
        </p>
      </section>

      <section>
        <h2>5. Entrega</h2>
        <p>
          Una vez confirmado el pago, se registra tu pedido y se coordina la entrega según la
          información de tu cuenta. Los plazos pueden variar según la disponibilidad y la zona de
          envío.
        </p>
      </section>

      <section>
        <h2>6. Cambios y devoluciones</h2>
        <p>
          Si tu pedido presenta algún problema, puedes solicitar un cambio o la devolución del
          dinero según la legislación de protección al consumidor vigente en Perú. Contáctanos por
          los medios indicados al final de esta página.
        </p>
      </section>

      <section>
        <h2>7. Uso del asistente con IA</h2>
        <p>
          El asistente ofrece recomendaciones para ayudarte a comprar; sus respuestas son
          orientativas y pueden contener imprecisiones. La decisión de compra es siempre tuya.
        </p>
      </section>

      <section>
        <h2>8. Cambios en estos términos</h2>
        <p>
          Podemos actualizar estos Términos cuando sea necesario. La versión vigente siempre estará
          publicada en esta página.
        </p>
      </section>

      <section>
        <h2>9. Contacto</h2>
        <p>
          Para consultas o reclamos, escríbenos a <strong>soporte@inkashop.com</strong>.
        </p>
      </section>

      <p>
        <Link to="/">← Volver al inicio</Link>
      </p>
    </div>
  )
}
