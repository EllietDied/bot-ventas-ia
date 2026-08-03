import ReactDOM from 'react-dom/client'
import { FORMAS_INKA } from './componentes/figurasInka'
import './simbolos.css'

const NOMBRES: Record<string, string> = {
  chakana: 'Chakana',
  sol: 'Sol andino',
  condor: 'Cóndor',
  tumi: 'Tumi',
  quipu: 'Quipu',
  montanas: 'Cordillera andina',
  intihuatana: 'Intihuatana',
  wiphala: 'Wiphala geométrica',
  greca: 'Espiral andina',
  rombos: 'Rombos textiles',
  aribalo: 'Aríbalo',
  kero: 'Kero',
  chaska: 'Chaska',
  cruzdelsur: 'Cruz del Sur',
  llama: 'Llama',
  nawi: 'Nawi · ojo andino',
}

function Galeria() {
  return (
    <main>
      <header>
        <span>Biblioteca visual · IA InkaShop</span>
        <h1>Símbolos andinos</h1>
        <p>Selecciona visualmente cuáles conservamos o cuáles quieres redibujar.</p>
        <a href="/">← Volver a la portada</a>
      </header>

      <section>
        {Object.entries(FORMAS_INKA).map(([nombre, Forma], indice) => (
          <article key={nombre}>
            <div className="numero">{String(indice + 1).padStart(2, '0')}</div>
            <svg viewBox="0 0 64 64" aria-label={NOMBRES[nombre]}>
              <defs>
                <linearGradient id={`oro-${nombre}`} x1="0%" y1="10%" x2="100%" y2="90%">
                  <stop offset="0%" stopColor="#986314" />
                  <stop offset="42%" stopColor="#ffe4a3" />
                  <stop offset="70%" stopColor="#e8b84b" />
                  <stop offset="100%" stopColor="#82500d" />
                </linearGradient>
              </defs>
              <g style={{ stroke: `url(#oro-${nombre})` }}>
                <Forma />
              </g>
            </svg>
            <h2>{NOMBRES[nombre]}</h2>
            <p>{nombre}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Galeria />)
