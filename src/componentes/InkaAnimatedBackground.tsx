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
  // Greca / patrón geométrico andino (espiral escalonada)
  greca: () => (
    <>
      <path pathLength={1} d="M20 82 L20 22 L80 22 L80 74 L38 74 L38 42 L64 42 L64 60 L50 60" />
    </>
  ),
  llama: () => (
    <>
      <path
        pathLength={1}
        d="M36 82 L36 48 C36 42 30 38 30 30 C30 20 32 12 39 10 L39 5 L44 4 L45 11 C51 11 53 18 53 26 L53 44 C53 48 57 50 62 50 L76 50 C82 50 85 54 85 60 L85 82 L78 82 L78 56 L44 56 L44 82 Z"
      />
      <path pathLength={1} d="M85 54 Q91 52 91 46" />
    </>
  ),
  chullo: () => (
    <>
      <circle pathLength={1} cx="50" cy="12" r="5" />
      <path pathLength={1} d="M50 17 V24" />
      <path pathLength={1} d="M22 70 Q22 24 50 24 Q78 24 78 70 Z" />
      <path pathLength={1} d="M22 70 L15 76 L21 90 L30 78 M78 70 L85 76 L79 90 L70 78" />
      <path pathLength={1} d="M24 80 L21 94 M28 82 V95 M32 80 L35 94 M76 80 L79 94 M72 82 V95 M68 80 L65 94" />
      <path pathLength={1} d="M26 40 H74 M26 54 H74" />
      <path pathLength={1} d="M28 35 l8 -6 l8 6 l8 -6 l8 6 l8 -6" />
      <path pathLength={1} d="M30 49 l6 5 l6 -5 M48 49 l6 5 l6 -5" />
    </>
  ),
  ceramica: () => (
    <>
      <path
        pathLength={1}
        d="M36 18 H64 L60 28 Q78 38 78 58 Q78 84 50 84 Q22 84 22 58 Q22 38 40 28 Z"
      />
      <path pathLength={1} d="M27 50 H73 M30 62 H70" />
      <path pathLength={1} d="M34 56 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5" />
    </>
  ),
  colibri: () => (
    <>
      <path pathLength={1} d="M46 48 L22 44" />
      <circle pathLength={1} cx="48" cy="48" r="3.5" />
      <path pathLength={1} d="M50 50 Q47 64 50 80 L46 75 M50 80 L54 75" />
      <path pathLength={1} d="M50 50 Q40 40 26 42 Q40 46 48 54" />
      <path pathLength={1} d="M50 50 Q60 40 74 42 Q60 46 52 54" />
    </>
  ),
  chaska: () => (
    <>
      <path pathLength={1} d="M50 12 L58 42 L88 50 L58 58 L50 88 L42 58 L12 50 L42 42 Z" />
      <path pathLength={1} d="M30 30 L46 46 M70 30 L54 46 M30 70 L46 54 M70 70 L54 54" />
      <circle pathLength={1} cx="50" cy="50" r="5" />
    </>
  ),
  maiz: () => (
    <>
      <path pathLength={1} d="M50 20 Q34 26 34 50 Q34 76 50 82 Q66 76 66 50 Q66 26 50 20 Z" />
      <path pathLength={1} d="M40 30 L60 30 M37 40 L63 40 M37 50 L63 50 M37 60 L63 60 M40 70 L60 70" />
      <path pathLength={1} d="M44 24 L44 78 M50 22 L50 80 M56 24 L56 78" />
      <path pathLength={1} d="M50 20 Q44 10 38 8 M50 20 Q56 10 62 8" />
    </>
  ),
  rana: () => (
    <>
      <path pathLength={1} d="M32 42 Q32 30 42 30 L58 30 Q68 30 68 42 Q68 60 50 60 Q32 60 32 42 Z" />
      <circle pathLength={1} cx="41" cy="34" r="4" />
      <circle pathLength={1} cx="59" cy="34" r="4" />
      <path pathLength={1} d="M44 52 Q50 56 56 52" />
      <path pathLength={1} d="M32 46 Q18 46 16 58 Q15 68 23 67 M34 54 Q24 62 26 72" />
      <path pathLength={1} d="M68 46 Q82 46 84 58 Q85 68 77 67 M66 54 Q76 62 74 72" />
    </>
  ),
  flor: () => (
    <>
      <circle pathLength={1} cx="50" cy="50" r="6" />
      <path pathLength={1} d="M50 44 C45 34 45 25 50 19 C55 25 55 34 50 44 Z" />
      <path pathLength={1} d="M50 44 C45 34 45 25 50 19 C55 25 55 34 50 44 Z" transform="rotate(60 50 50)" />
      <path pathLength={1} d="M50 44 C45 34 45 25 50 19 C55 25 55 34 50 44 Z" transform="rotate(120 50 50)" />
      <path pathLength={1} d="M50 44 C45 34 45 25 50 19 C55 25 55 34 50 44 Z" transform="rotate(180 50 50)" />
      <path pathLength={1} d="M50 44 C45 34 45 25 50 19 C55 25 55 34 50 44 Z" transform="rotate(240 50 50)" />
      <path pathLength={1} d="M50 44 C45 34 45 25 50 19 C55 25 55 34 50 44 Z" transform="rotate(300 50 50)" />
    </>
  ),
  pez: () => (
    <>
      <path pathLength={1} d="M22 50 Q40 36 64 44 Q76 48 82 50 Q76 52 64 56 Q40 64 22 50 Z" />
      <path pathLength={1} d="M82 50 L94 42 L90 50 L94 58 Z" />
      <circle pathLength={1} cx="34" cy="48" r="2" />
      <path pathLength={1} d="M46 44 Q52 50 46 56 M56 45 Q62 50 56 55" />
    </>
  ),
  terrazas: () => (
    <>
      <path pathLength={1} d="M16 82 H84" />
      <path pathLength={1} d="M22 82 V70 H78 V82 M30 70 V58 H70 V70 M38 58 V46 H62 V58 M46 46 V36 H54 V46" />
    </>
  ),
}

interface FiguraInka {
  tipo: string
  estilo: React.CSSProperties // posición y tamaño en el fondo
  soloPC?: boolean // se oculta en celular para no saturar
}

const TIPOS = Object.keys(FORMAS)
const TOTAL = 120
const ACTIVAS = 15 // cuántas se marcan en dorado al mismo tiempo
const MIN_DIST = 6.3 // separación mínima entre centros (% del ancho)
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
    const id = setInterval(() => setActivos((prev) => elegir(prev)), 4400)
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
          {/* Chispa (punta de la varita mágica) que recorre el trazo al dibujarlo */}
          {activos.includes(i) && <g className="inka-fig-spark">{FORMAS[f.tipo]()}</g>}
        </svg>
      ))}
    </div>
  )
}
