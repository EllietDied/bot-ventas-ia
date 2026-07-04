import { useEffect, useState } from 'react'
import { Direccion } from '../core/modelos/Direccion'
import {
  listarDirecciones,
  agregarDireccion,
  MAX_DIRECCIONES,
} from '../core/servicios/DireccionesService'

interface Props {
  idUsuario: string
  // Datos para pre-llenar una dirección nueva (los del perfil del cliente).
  prefill?: { receptor?: string; telefono?: string; direccion?: string }
  // Se llama cada vez que cambia la dirección elegida (o null si aún no hay ninguna).
  onSeleccionar: (dir: Direccion | null) => void
}

// El cliente elige una de sus direcciones guardadas (hasta 3) o agrega una nueva,
// ANTES de pagar. Cada cambio se notifica al checkout con onSeleccionar.
export function SelectorEnvio({ idUsuario, prefill, onSeleccionar }: Props) {
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [elegida, setElegida] = useState('')
  const [agregando, setAgregando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    receptor: prefill?.receptor ?? '',
    telefono: prefill?.telefono ?? '',
    direccion: prefill?.direccion ?? '',
    referencia: '',
  })

  // Al montar, cargamos las direcciones guardadas y preseleccionamos la primera.
  useEffect(() => {
    listarDirecciones(idUsuario).then((ds) => {
      setDirecciones(ds)
      if (ds.length > 0) {
        setElegida(ds[0].id)
        onSeleccionar(ds[0])
      } else {
        setAgregando(true)
        onSeleccionar(null)
      }
    })
    // onSeleccionar viene de un useState del padre (estable); no va en deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuario])

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function elegir(d: Direccion) {
    setElegida(d.id)
    onSeleccionar(d)
  }

  async function guardarNueva() {
    setError('')
    if (!form.receptor.trim() || !form.direccion.trim()) {
      setError('Completa al menos quién recibe y la dirección.')
      return
    }
    setGuardando(true)
    const nueva = await agregarDireccion(idUsuario, {
      receptor: form.receptor.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      referencia: form.referencia.trim(),
    })
    setGuardando(false)
    if (!nueva) {
      setError(`No se pudo guardar (máximo ${MAX_DIRECCIONES} direcciones).`)
      return
    }
    setDirecciones((prev) => [...prev, nueva])
    setElegida(nueva.id)
    onSeleccionar(nueva)
    setAgregando(false)
    setForm({ receptor: '', telefono: '', direccion: '', referencia: '' })
  }

  return (
    <div className="selector-envio">
      {/* Direcciones guardadas (elige una) */}
      {direcciones.length > 0 && (
        <div className="direcciones-lista">
          {direcciones.map((d) => (
            <label key={d.id} className={'direccion-item' + (elegida === d.id ? ' activo' : '')}>
              <input
                type="radio"
                name="dir"
                checked={elegida === d.id}
                onChange={() => elegir(d)}
              />
              <span>
                <strong>{d.receptor}</strong> — {d.direccion}
                {d.referencia ? ` (${d.referencia})` : ''}
                <br />
                <span className="texto-tenue">{d.telefono}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Formulario para una dirección nueva */}
      {agregando ? (
        <div className="tarjeta" style={{ padding: '1rem', marginTop: '0.6rem' }}>
          <h3>Nueva dirección</h3>
          <label className="campo">
            <span>Quién recibe *</span>
            <input value={form.receptor} onChange={(e) => set('receptor', e.target.value)} />
          </label>
          <label className="campo">
            <span>Teléfono</span>
            <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
          </label>
          <label className="campo">
            <span>Dirección *</span>
            <input value={form.direccion} onChange={(e) => set('direccion', e.target.value)} />
          </label>
          <label className="campo">
            <span>Referencia</span>
            <input value={form.referencia} onChange={(e) => set('referencia', e.target.value)} />
          </label>
          {error && <p className="mensaje-error">{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primario" disabled={guardando} onClick={guardarNueva}>
              {guardando ? 'Guardando…' : 'Guardar dirección'}
            </button>
            {direcciones.length > 0 && (
              <button
                className="btn btn-secundario"
                onClick={() => {
                  setAgregando(false)
                  setError('')
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      ) : (
        direcciones.length < MAX_DIRECCIONES && (
          <button
            type="button"
            className="chip"
            onClick={() => setAgregando(true)}
            style={{ marginTop: '0.6rem' }}
          >
            + Agregar otra dirección
          </button>
        )
      )}
    </div>
  )
}
