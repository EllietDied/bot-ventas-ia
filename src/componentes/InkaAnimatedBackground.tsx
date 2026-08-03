import { memo, useEffect, useId, useState } from 'react'
import { FORMAS_INKA } from './figurasInka'

export { FORMAS_INKA as FORMAS } from './figurasInka'

interface FiguraInka {
  tipo: string
  estilo: React.CSSProperties
  soloPC: boolean
  destacada: boolean
}

const TIPOS = Object.keys(FORMAS_INKA)
const TIPOS_PRINCIPALES = new Set(['chakana', 'sol', 'condor', 'tumi'])
const TOTAL = 48
const ACTIVAS = 3
const MIN_DIST = 8.2
const ASPECTO_Y = 0.62

// Mantiene la composición estable entre recargas.
function crearAleatorio(semilla: number) {
  let estado = semilla >>> 0
  return () => {
    estado += 0x6d2b79f5
    let n = estado
    n = Math.imul(n ^ (n >>> 15), n | 1)
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61)
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296
  }
}

// Distribuye las figuras con aire suficiente y dos niveles de escala.
function generarFiguras(total = TOTAL): FiguraInka[] {
  const aleatorio = crearAleatorio(0x1a4b2026 + total)
  const puntos: { x: number; y: number }[] = []
  let distanciaMinima = MIN_DIST
  let fallos = 0
  let intentos = 0

  while (puntos.length < total && intentos < 200000) {
    intentos++
    const x = 3 + aleatorio() * 94
    const y = 3 + aleatorio() * 94
    const libre = puntos.every((punto) => {
      const dx = x - punto.x
      const dy = (y - punto.y) * ASPECTO_Y
      return dx * dx + dy * dy >= distanciaMinima * distanciaMinima
    })

    if (libre) {
      puntos.push({ x, y })
      fallos = 0
    } else {
      fallos++
      if (fallos > 50) {
        distanciaMinima *= 0.94
        fallos = 0
      }
    }
  }

  // Se asignan por orden espacial para que un mismo símbolo no se repita
  // varias veces dentro de la misma zona visible.
  const puntosOrdenados = [...puntos].sort((a, b) => a.y - b.y || a.x - b.x)
  const tipoPorPunto = new Map(
    puntosOrdenados.map((punto, indice) => [punto, TIPOS[(indice * 5) % TIPOS.length]]),
  )

  return puntos.map((punto, indice) => {
    const tipo = tipoPorPunto.get(punto) ?? TIPOS[indice % TIPOS.length]
    const destacada = TIPOS_PRINCIPALES.has(tipo)
    const width = (destacada ? 5.5 + aleatorio() * 0.9 : 3.55 + aleatorio() * 0.9).toFixed(2) + '%'

    return {
      tipo,
      destacada,
      estilo: {
        left: punto.x.toFixed(2) + '%',
        top: punto.y.toFixed(2) + '%',
        width,
      },
      soloPC: !destacada && aleatorio() < 0.86,
    }
  })
}

interface FiguraProps extends FiguraInka {
  activa: boolean
}

const FiguraSVG = memo(function FiguraSVG({
  tipo,
  estilo,
  soloPC,
  destacada,
  activa,
}: FiguraProps) {
  const idOro = `inka-oro-${useId().replace(/:/g, '')}`
  const estiloConOro = {
    ...estilo,
    '--inka-gold': `url(#${idOro})`,
  } as React.CSSProperties
  const Forma = FORMAS_INKA[tipo]

  return (
    <svg
      viewBox="0 0 64 64"
      className={
        'inka-fig' +
        (soloPC ? ' solo-pc' : '') +
        (destacada ? ' inka-fig--focal' : '') +
        (activa ? ' is-drawing' : '')
      }
      style={estiloConOro}
      focusable="false"
    >
      <defs>
        <linearGradient id={idOro} x1="0%" y1="10%" x2="100%" y2="90%">
          <stop offset="0%" stopColor="#9a6515" />
          <stop offset="42%" stopColor="#ffe4a3" />
          <stop offset="70%" stopColor="#e8b84b" />
          <stop offset="100%" stopColor="#82500d" />
        </linearGradient>
      </defs>
      <g className="inka-fig-base">
        <Forma />
      </g>
      <g className="inka-fig-gold">
        <Forma />
      </g>
      {activa && (
        <g className="inka-fig-spark">
          <Forma />
        </g>
      )}
    </svg>
  )
})

interface InkaBgProps {
  total?: number
  activas?: number
  intervalo?: number
}

export function InkaAnimatedBackground({
  total = TOTAL,
  activas = ACTIVAS,
  intervalo = 1600,
}: InkaBgProps = {}) {
  const [figuras] = useState(() => generarFiguras(total))
  const [activos, setActivos] = useState<number[]>([])
  const [reducirMovimiento, setReducirMovimiento] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)')
    const actualizar = () => setReducirMovimiento(consulta.matches)
    consulta.addEventListener('change', actualizar)
    return () => consulta.removeEventListener('change', actualizar)
  }, [])

  useEffect(() => {
    if (reducirMovimiento || figuras.length === 0) {
      setActivos([])
      return
    }

    let cola: number[] = []
    const id = window.setInterval(() => {
      let siguiente = Math.floor(Math.random() * figuras.length)
      let intentos = 0
      while (cola.includes(siguiente) && intentos < 40) {
        siguiente = Math.floor(Math.random() * figuras.length)
        intentos++
      }
      cola = [...cola, siguiente].slice(-activas)
      setActivos(cola)
    }, intervalo)

    return () => window.clearInterval(id)
  }, [figuras.length, activas, intervalo, reducirMovimiento])

  return (
    <div className="inka-bg" aria-hidden="true">
      {figuras.map((figura, indice) => (
        <FiguraSVG
          key={`${figura.tipo}-${indice}`}
          {...figura}
          activa={activos.includes(indice)}
        />
      ))}
    </div>
  )
}
