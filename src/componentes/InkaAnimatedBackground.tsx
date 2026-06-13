import { useEffect, useState } from 'react'

// Fondo animado premium con estética incaica para IA InkaShop.
// Cada figura es un SVG de líneas blancas (contorno, sin relleno). Cada cierto
// tiempo, una energía dorada "dibuja" el contorno de una figura al azar
// (stroke-dasharray/stroke-dashoffset), la mantiene dorada ~2 s y vuelve a blanco.
// Es solo capa visual: no toca la lógica del proyecto. pointer-events: none.

// pathLength={1} normaliza el largo de cada trazo, así la animación de
// "dibujado" funciona igual para cualquier figura sin medir su longitud.
const FORMAS: Record<string, () => JSX.Element> = {
  chakana: () => (
    <>
      <path
        pathLength={1}
        d="M42 12 L58 12 L58 28 L72 28 L72 42 L88 42 L88 58 L72 58 L72 72 L58 72 L58 88 L42 88 L42 72 L28 72 L28 58 L12 58 L12 42 L28 42 L28 28 L42 28 Z"
      />
      <circle pathLength={1} cx="50" cy="50" r="7" />
    </>
  ),
  sol: () => (
    <>
      <circle pathLength={1} cx="50" cy="50" r="20" />
      <circle pathLength={1} cx="50" cy="50" r="8" />
      <path
        pathLength={1}
        d="M50 22 V8 M50 78 V92 M22 50 H8 M78 50 H92 M31 31 L21 21 M69 31 L79 21 M31 69 L21 79 M69 69 L79 79"
      />
      <circle pathLength={1} cx="44" cy="47" r="2.2" />
      <circle pathLength={1} cx="56" cy="47" r="2.2" />
      <path pathLength={1} d="M44 56 Q50 61 56 56" />
    </>
  ),
  condor: () => (
    <>
      <circle pathLength={1} cx="50" cy="22" r="3.4" />
      <path pathLength={1} d="M50 26 L48 70 L44 78 M50 26 L52 70 L56 78" />
      <path pathLength={1} d="M50 40 C40 33 24 34 8 47 C24 45 34 47 47 52" />
      <path pathLength={1} d="M50 40 C60 33 76 34 92 47 C76 45 66 47 53 52" />
      <path pathLength={1} d="M16 45 L21 50 M27 43 L31 49 M38 43 L42 50" />
      <path pathLength={1} d="M84 45 L79 50 M73 43 L69 49 M62 43 L58 50" />
    </>
  ),
  puma: () => (
    <>
      <path pathLength={1} d="M30 24 L38 13 L45 24 M70 24 L62 13 L55 24" />
      <path pathLength={1} d="M34 22 Q21 36 27 55 Q35 75 50 75 Q65 75 73 55 Q79 36 66 22" />
      <circle pathLength={1} cx="40" cy="41" r="2.6" />
      <circle pathLength={1} cx="60" cy="41" r="2.6" />
      <path pathLength={1} d="M45 51 L50 56 L55 51 M50 56 V63 Q45 65 42 62 M50 63 Q55 65 58 62" />
      <path pathLength={1} d="M32 47 L22 46 M32 51 L22 53 M68 47 L78 46 M68 51 L78 53" />
    </>
  ),
  serpiente: () => (
    <>
      <path pathLength={1} d="M14 72 Q30 50 44 64 Q58 78 72 60 Q85 44 84 32" />
      <path pathLength={1} d="M84 32 Q84 26 79 25 Q73 26 76 32" />
      <circle pathLength={1} cx="80" cy="30" r="1.2" />
      <path pathLength={1} d="M14 72 L9 75 M14 72 L10 68" />
      <path pathLength={1} d="M34 58 l3 3 M50 67 l3 -3 M66 59 l3 3" />
    </>
  ),
  tumi: () => (
    <>
      <rect pathLength={1} x="38" y="14" width="24" height="22" rx="3" fill="none" />
      <circle pathLength={1} cx="50" cy="22" r="4" />
      <path pathLength={1} d="M44 30 H56" />
      <rect pathLength={1} x="45" y="36" width="10" height="8" fill="none" />
      <path pathLength={1} d="M28 48 H72 A22 26 0 0 1 28 48 Z" />
    </>
  ),
  quipu: () => (
    <>
      <path pathLength={1} d="M12 24 Q50 17 88 24" />
      <path pathLength={1} d="M24 22 V72 M38 21 V60 M50 20 V78 M62 21 V58 M76 23 V68" />
      <circle pathLength={1} cx="24" cy="40" r="2.4" />
      <circle pathLength={1} cx="24" cy="56" r="2.4" />
      <circle pathLength={1} cx="38" cy="44" r="2.4" />
      <circle pathLength={1} cx="50" cy="38" r="2.4" />
      <circle pathLength={1} cx="50" cy="58" r="2.4" />
      <circle pathLength={1} cx="62" cy="42" r="2.4" />
      <circle pathLength={1} cx="76" cy="48" r="2.4" />
    </>
  ),
  montanas: () => (
    <>
      <circle pathLength={1} cx="50" cy="30" r="11" />
      <path pathLength={1} d="M8 80 L30 44 L44 64 L58 38 L78 72 L92 80" />
      <path pathLength={1} d="M30 44 L24 54 M58 38 L52 50" />
      <path pathLength={1} d="M8 80 H92" />
    </>
  ),
  mascara: () => (
    <>
      <rect pathLength={1} x="26" y="18" width="48" height="64" rx="10" fill="none" />
      <path pathLength={1} d="M34 30 l7 -7 l7 7 l7 -7 l7 7" />
      <rect pathLength={1} x="33" y="38" width="14" height="9" rx="2" fill="none" />
      <rect pathLength={1} x="53" y="38" width="14" height="9" rx="2" fill="none" />
      <path pathLength={1} d="M50 47 V63 L43 63" />
      <path pathLength={1} d="M38 72 H62" />
    </>
  ),
}

interface FiguraInka {
  tipo: string
  estilo: React.CSSProperties // posición y tamaño en el fondo
  soloPC?: boolean // se oculta en celular para no saturar
}

const TIPOS = Object.keys(FORMAS)
const TOTAL = 100
const ACTIVAS = 10 // cuántas se marcan en dorado al mismo tiempo
const MIN_DIST = 6.6 // separación mínima entre centros (% del ancho)
const ASPECTO_Y = 0.62 // el alto del contenedor ≈ 0.62 del ancho

// Genera 100 figuras en posiciones AL AZAR (desordenadas, sin rejilla), pero
// con una separación mínima entre ellas (dardos con rechazo) para que NUNCA se
// encimen. Si cuesta colocarlas, relaja un poco la separación. Tipos y tamaños
// también al azar.
function generarFiguras(): FiguraInka[] {
  const puntos: { x: number; y: number }[] = []
  let minDist = MIN_DIST
  let fallos = 0
  let guarda = 0
  while (puntos.length < TOTAL && guarda < 200000) {
    guarda++
    const x = 3 + Math.random() * 94
    const y = 3 + Math.random() * 94
    let libre = true
    for (const p of puntos) {
      const dx = x - p.x
      const dy = (y - p.y) * ASPECTO_Y // distancia vertical equivalente (px)
      if (dx * dx + dy * dy < minDist * minDist) {
        libre = false
        break
      }
    }
    if (libre) {
      puntos.push({ x, y })
      fallos = 0
    } else {
      fallos++
      if (fallos > 50) {
        minDist *= 0.94 // si cuesta colocar, relajamos un poco la separación
        fallos = 0
      }
    }
  }
  // Asignamos un tipo al azar a cada punto (repartidos de forma pareja)
  const tipos: string[] = []
  for (let i = 0; i < puntos.length; i++) tipos.push(TIPOS[i % TIPOS.length])
  for (let i = tipos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = tipos[i]
    tipos[i] = tipos[j]
    tipos[j] = t
  }
  return puntos.map((p, i) => {
    // Tamaño relativo al ancho (menor que la separación → no se solapan)
    const width = (4.6 + Math.random() * 1.4).toFixed(2) + '%' // 4.6–6.0 %
    return {
      tipo: tipos[i],
      estilo: { left: p.x.toFixed(2) + '%', top: p.y.toFixed(2) + '%', width },
      soloPC: Math.random() < 0.85, // en celular se ven ~15
    }
  })
}

export function InkaAnimatedBackground() {
  // Las figuras se generan una sola vez (posiciones al azar estables).
  const [figuras] = useState(generarFiguras)
  // Índices de las figuras que la energía dorada dibuja ahora (5 a la vez).
  const [activos, setActivos] = useState<number[]>([])

  useEffect(() => {
    // Cada ~2.4 s elegimos otras 5 figuras al azar (distintas a las anteriores).
    function elegir(previas: number[]): number[] {
      const nuevas: number[] = []
      while (nuevas.length < ACTIVAS && nuevas.length < figuras.length) {
        const n = Math.floor(Math.random() * figuras.length)
        if (!nuevas.includes(n) && !previas.includes(n)) nuevas.push(n)
      }
      return nuevas
    }
    setActivos((prev) => elegir(prev))
    const id = setInterval(() => setActivos((prev) => elegir(prev)), 2600)
    return () => clearInterval(id)
  }, [figuras.length])

  return (
    <div className="inka-bg" aria-hidden="true">
      {figuras.map((f, i) => (
        <svg
          key={i}
          viewBox="0 0 100 100"
          className={
            'inka-fig' + (f.soloPC ? ' solo-pc' : '') + (activos.includes(i) ? ' is-drawing' : '')
          }
          style={f.estilo}
        >
          {/* Contorno blanco permanente */}
          <g className="inka-fig-base">{FORMAS[f.tipo]()}</g>
          {/* Contorno dorado que se dibuja encima cuando está activa */}
          <g className="inka-fig-gold">{FORMAS[f.tipo]()}</g>
        </svg>
      ))}
    </div>
  )
}
