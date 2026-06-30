import { Link } from 'react-router-dom'

// Página pública de Política de Privacidad (requisito de la pasarela de pagos).
// Solo contenido (texto). Plantilla base: para uso real conviene revisión legal.
export function Privacidad() {
  return (
    <div className="pagina pagina-legal">
      <h1>Política de Privacidad</h1>
      <p className="texto-tenue">Última actualización: junio de 2026</p>

      <section>
        <h2>1. Datos que recopilamos</h2>
        <p>
          Al registrarte y usar IA InkaShop recopilamos: nombre y apellido, correo electrónico,
          teléfono, documento de identidad, sexo, y tu dirección. También guardamos tus pedidos,
          movimientos de billetera y las consultas que haces al asistente.
        </p>
      </section>

      <section>
        <h2>2. Para qué usamos tus datos</h2>
        <p>
          Usamos tus datos para crear tu cuenta, procesar tus compras y pagos, entregarte tus
          pedidos, mostrarte recomendaciones y brindarte soporte. No vendemos tu información a
          terceros.
        </p>
      </section>

      <section>
        <h2>3. Dónde se guardan</h2>
        <p>
          Tu información se almacena de forma segura en <strong>Supabase</strong> (base de datos en
          la nube), con políticas de acceso que hacen que cada usuario solo pueda ver sus propios
          datos. Las contraseñas las gestiona el sistema de autenticación y nunca se guardan en
          texto plano.
        </p>
      </section>

      <section>
        <h2>4. Pagos</h2>
        <p>
          Los pagos los procesa <strong>Culqi</strong>. Los datos de tu tarjeta se ingresan en su
          entorno seguro y <strong>nosotros no los almacenamos</strong>. Solo guardamos el
          resultado del pago (aprobado/rechazado) y el monto, para acreditar tu compra o tu saldo.
        </p>
      </section>

      <section>
        <h2>5. Asistente con IA</h2>
        <p>
          Cuando usas el asistente, enviamos a nuestro proveedor de IA solo lo necesario para
          responder (tu consulta y datos del catálogo). <strong>Nunca</strong> se envían tu
          contraseña ni los datos de tu medio de pago.
        </p>
      </section>

      <section>
        <h2>6. Con quién compartimos datos</h2>
        <p>
          Solo compartimos lo indispensable con los proveedores que hacen funcionar la app
          (alojamiento, base de datos y pasarela de pagos), y únicamente para prestarte el servicio.
        </p>
      </section>

      <section>
        <h2>7. Tus derechos</h2>
        <p>
          Puedes solicitar acceder, corregir o eliminar tus datos personales escribiéndonos. También
          puedes cerrar tu cuenta cuando quieras.
        </p>
      </section>

      <section>
        <h2>8. Almacenamiento en tu navegador</h2>
        <p>
          Guardamos algunos datos en tu navegador (por ejemplo, tu carrito o preferencias de tema)
          para que la app funcione mejor. Puedes borrarlos desde la configuración de tu navegador.
        </p>
      </section>

      <section>
        <h2>9. Contacto</h2>
        <p>
          Para ejercer tus derechos o resolver dudas sobre tu privacidad, escríbenos a{' '}
          <strong>soporte@inkashop.com</strong>.
        </p>
      </section>

      <p>
        <Link to="/">← Volver al inicio</Link>
      </p>
    </div>
  )
}
