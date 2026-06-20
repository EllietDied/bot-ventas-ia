import { PAISES, Pais } from '../config/paises'

// Selector de país (bandera + nombre + prefijo telefónico). El país elegido es la
// fuente de verdad del registro: de él dependen el documento y la dirección.
export function SelectorPais({
  value,
  onChange,
  id,
  describedBy,
}: {
  value: string
  onChange: (pais: Pais) => void
  id?: string
  describedBy?: string
}) {
  return (
    <select
      id={id}
      className="campo-select"
      value={value}
      aria-describedby={describedBy}
      onChange={(e) => {
        const pais = PAISES.find((p) => p.countryCode === e.target.value)
        if (pais) onChange(pais)
      }}
    >
      {PAISES.map((p) => (
        <option key={p.countryCode} value={p.countryCode}>
          {p.flag} {p.countryName} ({p.callingCode})
        </option>
      ))}
    </select>
  )
}
