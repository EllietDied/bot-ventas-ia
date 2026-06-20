import { getDocumento, getDocumentosPorPais } from '../config/identityDocuments'

// Campo de Documento de identidad que se ADAPTA al país seleccionado:
//  - muestra los tipos de documento válidos para ese país,
//  - cambia placeholder, teclado móvil, ayuda y caracteres permitidos,
//  - usa SIEMPRE <input type="text"> (nunca number) con inputMode adecuado,
//  - sanitiza lo escrito/pegado en cada cambio (normalize de la configuración),
//  - muestra el prefijo (Venezuela) y el complemento (Bolivia) cuando aplica.
//
// La validación la calcula el formulario (con validateIdentityDocument) y se pasa
// como `error`; aquí solo se muestra.
export function CampoDocumento({
  countryCode,
  documentCode,
  value,
  complemento,
  prefijo,
  error,
  tocado,
  onChangeTipo,
  onChangeValor,
  onChangeComplemento,
  onChangePrefijo,
  onBlur,
}: {
  countryCode: string
  documentCode: string
  value: string
  complemento: string
  prefijo: string
  error?: string | null
  tocado?: boolean
  onChangeTipo: (documentCode: string) => void
  onChangeValor: (value: string) => void
  onChangeComplemento: (value: string) => void
  onChangePrefijo: (value: string) => void
  onBlur: () => void
}) {
  const tipos = getDocumentosPorPais(countryCode)
  const config = getDocumento(countryCode, documentCode)
  const mostrarError = Boolean(tocado && error)
  const idAyuda = 'doc-ayuda'
  const idError = 'doc-error'

  return (
    <div className="campo-documento">
      {/* Tipo de documento (solo los válidos para el país) */}
      <label className="campo">
        <span>Tipo de documento *</span>
        <select
          className="campo-select"
          value={documentCode}
          onChange={(e) => onChangeTipo(e.target.value)}
        >
          {tipos.map((t) => (
            <option key={t.documentCode} value={t.documentCode}>
              {t.documentName}
            </option>
          ))}
        </select>
      </label>

      {/* Número de documento (con prefijo/complemento cuando corresponde) */}
      <label className="campo">
        <span>Número de documento *</span>
        <div className="doc-fila">
          {/* Venezuela: prefijo V/E en un selector aparte */}
          {config.prefixes && config.prefixes.length > 0 && (
            <select
              className="campo-select doc-prefijo"
              value={prefijo || config.prefixes[0]}
              aria-label="Prefijo del documento"
              onChange={(e) => onChangePrefijo(e.target.value)}
            >
              {config.prefixes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            inputMode={config.inputMode}
            className="doc-numero"
            value={value}
            placeholder={config.placeholder}
            maxLength={25}
            autoComplete="off"
            aria-invalid={mostrarError}
            aria-describedby={mostrarError ? idError : idAyuda}
            onChange={(e) => onChangeValor(config.normalize(e.target.value))}
            onBlur={onBlur}
          />

          {/* Bolivia: complemento alfanumérico opcional */}
          {config.hasComplement && (
            <input
              type="text"
              inputMode="text"
              className="doc-complemento"
              value={complemento}
              placeholder="1A"
              maxLength={2}
              aria-label="Complemento (opcional)"
              onChange={(e) =>
                onChangeComplemento(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
              }
              onBlur={onBlur}
            />
          )}
        </div>
      </label>

      {/* Ayuda neutral + contador */}
      <div className="doc-pie">
        <span id={idAyuda} className="form-ayuda">
          {config.helpText}
        </span>
        <span className="contador">
          {value.length}/{config.maxLength}
        </span>
      </div>

      {mostrarError && (
        <p id={idError} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
