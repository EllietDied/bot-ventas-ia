import { getConfigDireccion, Ubicacion, NivelAdministrativo } from '../config/addressCountryConfig'
import { getOpcionesNivel } from '../data/locations'
import { limpiarDireccion } from '../utils/validarUbicacion'

const NIVEL_VACIO: NivelAdministrativo = { tipo: '', codigo: '', nombre: '' }

// Campos de dirección que se ADAPTAN al país (etiquetas y niveles correctos):
//  - cada nivel es un <select> si hay lista oficial integrada (Perú), o un
//    <input> de texto controlado si no la hay (no se inventan divisiones),
//  - los selectores son dependientes: al cambiar uno se limpian los hijos,
//  - muestra el código postal cuando el país lo usa, y la Dirección al final.
export function DynamicAddressFields({
  countryCode,
  value,
  errores,
  tocado,
  onChange,
  onBlur,
}: {
  countryCode: string
  value: Ubicacion
  errores: Record<string, string>
  tocado: Record<string, boolean>
  onChange: (ubicacion: Ubicacion) => void
  onBlur: (campo: string) => void
}) {
  const config = getConfigDireccion(countryCode)
  const niveles: NivelAdministrativo[] = [
    value.nivel1,
    value.nivel2,
    value.nivel3 ?? NIVEL_VACIO,
  ]

  // Actualiza un nivel y limpia los niveles dependientes (hijos).
  function actualizarNivel(indice: number, codigo: string, nombre: string) {
    const tipo = config.levels[indice].key
    const nuevo: NivelAdministrativo = { tipo, codigo, nombre }
    const u: Ubicacion = { ...value }
    if (indice === 0) {
      u.nivel1 = nuevo
      u.nivel2 = { ...NIVEL_VACIO }
      u.nivel3 = config.levels.length > 2 ? { ...NIVEL_VACIO } : null
    } else if (indice === 1) {
      u.nivel2 = nuevo
      if (config.levels.length > 2) u.nivel3 = { ...NIVEL_VACIO }
    } else {
      u.nivel3 = nuevo
    }
    onChange(u)
  }

  // Filtra el código postal según el tipo (numérico o texto).
  function cambiarCodigoPostal(texto: string) {
    const limpio =
      config.postalCode.inputMode === 'numeric' ? texto.replace(/\D/g, '') : texto.toUpperCase()
    onChange({ ...value, codigoPostal: limpio })
  }

  return (
    <div className="form-grid direccion-grid">
      {config.levels.map((lvl, i) => {
        const actual = niveles[i]
        const padre = i > 0 ? niveles[i - 1] : null
        const padreCodigo = i === 0 ? '' : padre?.codigo ?? ''
        const opciones = getOpcionesNivel(countryCode, lvl.key, padreCodigo)
        const bloqueado = Boolean(lvl.dependsOn) && (!padre || padre.nombre.trim() === '')
        const error = tocado[lvl.key] ? errores[lvl.key] : undefined
        const idCampo = 'addr-' + lvl.key

        return (
          <label className="campo" key={lvl.key}>
            <span>{lvl.label} *</span>
            {opciones.length > 0 ? (
              // Hay lista oficial: desplegable.
              <select
                id={idCampo}
                className="campo-select"
                value={actual.codigo}
                disabled={bloqueado}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? idCampo + '-error' : undefined}
                onChange={(e) => {
                  const op = opciones.find((o) => o.code === e.target.value)
                  actualizarNivel(i, op?.code ?? '', op?.name ?? '')
                }}
                onBlur={() => onBlur(lvl.key)}
              >
                <option value="">
                  {bloqueado ? `Selecciona primero ${config.levels[i - 1].label.toLowerCase()}` : lvl.placeholder}
                </option>
                {opciones.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              // Sin lista integrada: texto controlado (no se inventan divisiones).
              <input
                id={idCampo}
                type="text"
                value={actual.nombre}
                placeholder={bloqueado ? 'Completa el nivel anterior' : `Escribe ${lvl.label.toLowerCase()}`}
                disabled={bloqueado}
                autoComplete="off"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? idCampo + '-error' : undefined}
                onChange={(e) => actualizarNivel(i, '', e.target.value)}
                onBlur={() => onBlur(lvl.key)}
              />
            )}
            {error && (
              <p id={idCampo + '-error'} className="form-error" role="alert">
                {error}
              </p>
            )}
          </label>
        )
      })}

      {/* Código postal (cuando el país lo usa) */}
      {config.postalCode.enabled && (
        <label className="campo">
          <span>
            {config.postalCode.label}
            {config.postalCode.required ? ' *' : ''}
          </span>
          <input
            id="addr-codigoPostal"
            type="text"
            inputMode={config.postalCode.inputMode}
            value={value.codigoPostal}
            placeholder={config.postalCode.placeholder}
            maxLength={config.postalCode.maxLength}
            autoComplete="off"
            aria-invalid={Boolean(tocado.codigoPostal && errores.codigoPostal)}
            onChange={(e) => cambiarCodigoPostal(e.target.value)}
            onBlur={() => onBlur('codigoPostal')}
          />
          {tocado.codigoPostal && errores.codigoPostal && (
            <p className="form-error" role="alert">
              {errores.codigoPostal}
            </p>
          )}
        </label>
      )}

      {/* Dirección exacta (siempre, a todo el ancho) */}
      <label className="campo span-2">
        <span>{config.address.label} *</span>
        <input
          id="addr-direccion"
          type="text"
          value={value.direccion}
          placeholder={config.address.placeholder}
          maxLength={config.address.maxLength}
          autoComplete="off"
          aria-invalid={Boolean(tocado.direccion && errores.direccion)}
          onChange={(e) => onChange({ ...value, direccion: e.target.value })}
          onBlur={() => {
            // Saneamos al salir (sin borrar lo escrito ante un error).
            onChange({ ...value, direccion: limpiarDireccion(value.direccion) })
            onBlur('direccion')
          }}
        />
        {tocado.direccion && errores.direccion && (
          <p className="form-error" role="alert">
            {errores.direccion}
          </p>
        )}
      </label>
    </div>
  )
}
