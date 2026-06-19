import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../contexto/SesionContext'
import { useProductos } from '../contexto/ProductosContext'
import { InkaAnimatedBackground } from '../componentes/InkaAnimatedBackground'

// Características del sistema (sección "una forma más inteligente de comprar y vender").
const FEATURES = [
  {
    icono: '🤖',
    titulo: 'Asistente IA',
    texto: 'Pídelo en lenguaje natural y te arma la mejor opción según tu presupuesto.',
  },
  {
    icono: '🔎',
    titulo: 'Catálogo inteligente',
    texto: 'Busca por nombre, categoría o marca, con fotos reales del vendedor.',
  },
  {
    icono: '🛒',
    titulo: 'Checkout guiado',
    texto: 'Carrito y pago seguro paso a paso, sin fricción ni sustos.',
  },
]

// Franja de confianza (señales del proyecto, en vez de logos de marcas).
const CONFIANZA = [
  { icono: '🎓', texto: 'Respaldado por la USS' },
  { icono: '💬', texto: 'Asistente IA 24/7' },
  { icono: '🔒', texto: 'Pago 100% seguro' },
  { icono: '📱', texto: 'Disponible en web y móvil' },
]

// Cómo funciona el sistema, en 3 pasos (onboarding de un vistazo).
const PASOS = [
  {
    n: '1',
    titulo: 'Crea tu cuenta',
    texto: 'Regístrate como comprador o vendedor, o entra con la cuenta demo en un clic.',
  },
  {
    n: '2',
    titulo: 'Pregúntale a la IA o explora',
    texto: 'El asistente recomienda por texto, presupuesto e historial; o navega el catálogo.',
  },
  {
    n: '3',
    titulo: 'Compra con pago seguro',
    texto: 'Agrega al carrito y paga de forma segura con el checkout guiado, paso a paso.',
  },
]

// Preguntas frecuentes (resuelven dudas y objeciones).
const FAQS = [
  {
    p: '¿Cómo compro un producto?',
    r: 'Pídeselo al asistente o explora el catálogo, agrégalo al carrito y paga de forma segura.',
  },
  {
    p: '¿Mis pagos están protegidos?',
    r: 'Sí. Tu información viaja protegida y el checkout es seguro de principio a fin. Aceptamos tarjeta, Yape, Plin y efectivo.',
  },
  {
    p: '¿Qué puede hacer el asistente IA?',
    r: 'Recomienda por texto, categoría, presupuesto e historial, y arma comparaciones.',
  },
  {
    p: '¿Necesito instalar algo?',
    r: 'No, funciona desde el navegador. Si quieres, también puedes instalarla como app en tu teléfono.',
  },
]

// Pantalla de inicio: hero con propuesta de valor + inicio de sesión, y secciones
// de presentación (confianza, características, datos, FAQ). Solo capa visual.
export function Login() {
  const { login } = useSesion()
  const { productos, categorias } = useProductos()
  const navegar = useNavigate()

  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validación de campos vacíos.
    if (!correo.trim() || !contrasena.trim()) {
      setError('Completa todos los campos.')
      return
    }

    const resultado = login(correo, contrasena)
    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }
    navegar('/') // sesión iniciada
  }

  // Entrar rápido con la cuenta demo (útil para la presentación).
  function entrarDemo() {
    const r = login('comprador@demo.com', '123456')
    if (r.ok) navegar('/')
  }

  return (
    <div className="auth-landing">
      {/* ===== HERO: propuesta de valor + inicio de sesión, sobre el fondo inka ===== */}
      <section className="auth-contenedor inka-auth-bg">
        <InkaAnimatedBackground />
        <div className="landing-hero">
          <div className="landing-valor">
            <div className="landing-marca">
              <img
                src="/assistant-inkashop.svg"
                alt="Asistente IA de InkaShop"
                className="landing-mascota"
              />
              <span className="landing-marca-texto">
                <span className="marca-ia">IA</span> InkaShop
              </span>
            </div>
            <h1 className="landing-titular">Compra con respaldo, vende con innovación</h1>
            <p className="landing-sub">
              Tu asistente de ventas con IA: recomienda, compara y te guía hasta el pago. Todo en un
              solo lugar.
            </p>
            <ul className="landing-bullets">
              <li>Recomendaciones por texto, presupuesto e historial</li>
              <li>Catálogo con búsqueda por marca y categoría</li>
              <li>Pago seguro y protegido, paso a paso</li>
            </ul>
            <div className="landing-cta">
              <Link to="/registro" className="btn btn-dorado">
                Crear cuenta gratis
              </Link>
              <button type="button" className="btn btn-glass" onClick={entrarDemo}>
                Probar la demo
              </button>
            </div>
          </div>

          <div className="auth-tarjeta">
            <h2 className="auth-titulo">Inicia sesión</h2>
            <p className="auth-subtitulo">Entra para comprar o gestionar tu tienda.</p>

            <form onSubmit={enviar} className="formulario">
              <label className="campo">
                <span>Correo</span>
                <input
                  type="text"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </label>

              <label className="campo">
                <span>Contraseña</span>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••"
                />
              </label>

              {error && <p className="mensaje-error">{error}</p>}

              <button type="submit" className="btn btn-primario btn-bloque">
                Ingresar
              </button>
            </form>

            <p className="auth-pie">
              ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
            </p>

            <div className="auth-demo">
              <strong>Cuentas de prueba:</strong>
              <br />
              comprador@demo.com / 123456
              <br />
              vendedor@demo.com / 123456
            </div>
          </div>
        </div>
      </section>

      {/* ===== Secciones de presentación (inspiradas en una landing moderna) ===== */}
      <section className="landing-extra">
        <div className="landing-confianza">
          {CONFIANZA.map((c) => (
            <span className="confianza-chip" key={c.texto}>
              <span className="confianza-icono">{c.icono}</span> {c.texto}
            </span>
          ))}
        </div>

        <h2 className="landing-seccion-titulo">Una forma más inteligente de comprar y vender</h2>
        <div className="landing-features">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.titulo}>
              <div className="feature-icono">{f.icono}</div>
              <h3>{f.titulo}</h3>
              <p>{f.texto}</p>
            </div>
          ))}
        </div>

        <h2 className="landing-seccion-titulo">Cómo funciona</h2>
        <div className="landing-pasos">
          {PASOS.map((p) => (
            <div className="paso" key={p.n}>
              <span className="paso-num">{p.n}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </div>
          ))}
        </div>

        <div className="landing-stats">
          <div className="stat">
            <span className="stat-num">{productos.length}+</span>
            <span className="stat-lbl">productos</span>
          </div>
          <div className="stat">
            <span className="stat-num">{categorias.length}</span>
            <span className="stat-lbl">categorías</span>
          </div>
          <div className="stat">
            <span className="stat-num">24/7</span>
            <span className="stat-lbl">asistencia con IA</span>
          </div>
        </div>

        <h2 className="landing-seccion-titulo">Preguntas frecuentes</h2>
        <div className="landing-faq">
          {FAQS.map((f, i) => (
            <FaqItem key={i} pregunta={f.p} respuesta={f.r} />
          ))}
        </div>
      </section>
    </div>
  )
}

// Una pregunta del FAQ, que se abre y cierra (acordeón).
function FaqItem({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className={'faq-item' + (abierto ? ' abierto' : '')}>
      <button type="button" className="faq-pregunta" onClick={() => setAbierto(!abierto)}>
        <span>{pregunta}</span>
        <span className="faq-flecha">{abierto ? '−' : '+'}</span>
      </button>
      {abierto && <p className="faq-respuesta">{respuesta}</p>}
    </div>
  )
}
