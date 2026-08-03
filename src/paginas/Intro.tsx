import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { InkaAnimatedBackground } from '../componentes/InkaAnimatedBackground'
import { Icono } from '../componentes/Icono'

// Características del sistema.
const FEATURES = [
  {
    icono: 'ia',
    titulo: 'Asistente IA',
    texto: 'Pídelo en lenguaje natural y te arma la mejor opción según tu presupuesto.',
  },
  {
    icono: 'buscar',
    titulo: 'Catálogo inteligente',
    texto: 'Busca por nombre, categoría o marca, con fotos reales del vendedor.',
  },
  {
    icono: 'carrito',
    titulo: 'Checkout guiado',
    texto: 'Carrito y pago seguro paso a paso, sin fricción ni sustos.',
  },
]

// Franja de confianza (señales del proyecto).
const CONFIANZA = [
  { icono: 'universidad', texto: 'Respaldado por la USS' },
  { icono: 'chat', texto: 'Asistente IA 24/7' },
  { icono: 'candado', texto: 'Pago 100% seguro' },
  { icono: 'movil', texto: 'Disponible en web y móvil' },
]

// Cómo funciona, en 3 pasos.
const PASOS = [
  {
    n: '1',
    titulo: 'Crea tu cuenta',
    texto: 'Regístrate como comprador o vendedor, o pruébala al instante con un clic.',
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

// Preguntas frecuentes.
const FAQS = [
  {
    p: '¿Cómo compro un producto?',
    r: 'Pídeselo al asistente o explora el catálogo, agrégalo al carrito y paga de forma segura.',
  },
  {
    p: '¿Mis pagos están protegidos?',
    r: 'Sí. Tu información viaja protegida y el checkout es seguro de principio a fin. Aceptamos tarjeta, Yape, Plin y más.',
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

// Página introductoria pública (la puerta de entrada antes del login).
export function Intro() {
  const { productos, categorias } = useProductos()

  return (
    <div className="auth-landing inka-auth-bg">
      {/* El fondo de figuras inka cubre TODA la intro (hero + secciones) */}
      <InkaAnimatedBackground total={60} activas={3} intervalo={1600} />

      {/* ===== Hero introductorio ===== */}
      <section className="auth-contenedor">
        <div className="intro-hero">
          <img
            src="/assistant-inkashop.svg"
            alt="Asistente IA de InkaShop"
            className="intro-mascota"
          />
          <span className="intro-marca">
            <span className="marca-ia">IA</span> InkaShop
          </span>
          <h1 className="intro-titular">Compra con respaldo, vende con innovación</h1>
          <p className="intro-sub">
            Tu asistente de ventas con IA: recomienda, compara y te guía hasta el pago. Todo en un
            solo lugar.
          </p>
          <div className="intro-cta">
            <Link to="/registro" className="btn btn-dorado">
              Crear cuenta gratis
            </Link>
            <Link to="/login" className="btn btn-glass">
              Iniciar sesión
            </Link>
          </div>
          <Link to="/catalogo" className="intro-demo-link">
            ¿Solo quieres mirar? Ver el catálogo →
          </Link>
        </div>
      </section>

      {/* ===== Secciones de presentación ===== */}
      <section className="landing-extra">
        <div className="landing-confianza">
          {CONFIANZA.map((c) => (
            <span className="confianza-chip" key={c.texto}>
              <span className="confianza-icono">
              <Icono nombre={c.icono} size={16} />
            </span>{' '}
            {c.texto}
            </span>
          ))}
        </div>

        <h2 className="landing-seccion-titulo">Una forma más inteligente de comprar y vender</h2>
        <div className="landing-features">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.titulo}>
              <div className="feature-icono">
                <Icono nombre={f.icono} size={26} />
              </div>
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

        <div className="intro-cierre">
          <h2 className="landing-seccion-titulo">¿List@ para empezar?</h2>
          <div className="intro-cta">
            <Link to="/registro" className="btn btn-dorado">
              Crear cuenta gratis
            </Link>
            <Link to="/login" className="btn btn-glass">
              Iniciar sesión
            </Link>
          </div>
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
