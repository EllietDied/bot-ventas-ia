import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FORMAS } from '../componentes/InkaAnimatedBackground'

describe('biblioteca de símbolos inka', () => {
  it('mantiene disponibles los 16 símbolos editoriales auditados', () => {
    expect(Object.keys(FORMAS)).toHaveLength(16)
  })

  it.each(Object.entries(FORMAS))('%s tiene geometría SVG completa y normalizada', (_nombre, Forma) => {
    const marcado = renderToStaticMarkup(
      <svg viewBox="0 0 64 64">
        <Forma />
      </svg>,
    )
    const geometrias = marcado.match(/<(?:path|circle|rect)\b/g) ?? []
    const normalizadas = marcado.match(/pathLength="1"/g) ?? []

    expect(geometrias.length).toBeGreaterThan(0)
    expect(normalizadas).toHaveLength(geometrias.length)
    expect(marcado).not.toMatch(/\b(?:NaN|undefined)\b/)
    expect(marcado).not.toContain('d=""')
  })
})
