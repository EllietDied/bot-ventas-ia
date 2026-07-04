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
  onConfirmar: (dir: Direccion) => void
}

// Tras el pago: el cliente elige una de sus direcciones guardadas (hasta 3) o agrega
// una nueva. Al confirmar, devuelve la dirección elegida.
export function SelectorEnvio({ idUsuario, prefill, onConfirmar }: Props) {
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

  // Al montar, cargamos las direcciones guardadas del cliente.
  useEffect(() => {
    listarDirecciones(idUsuario).then((ds) => {
      setDirecciones(ds)
      if (ds.length > 0) setElegida(ds[0].id)
      else setAgregando(true) // si no tiene ninguna, mostramos el formulario directo
    })
  }, [idUsuario])

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
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
    setAgregando(false)
    setForm({ receptor: '', telefono: '', direccion: '', referencia: '' })
  }

  function confirmar() {
    const dir = direcciones.find((d) => d.id === elegida)
    if (dir) onConfirmar(dir)
  }

  return (
    <div className="selector-envio">
      <h2>¿A dónde enviamos tu pedido?</h2>

      {/* Direcciones guardadas (elige una) */}
      {direcciones.length > 0 && (
        <div className="direcciones-lista">
          {direcciones.map((d) => (
            <label key={d.id} className={'direccion-item' + (elegida === d.id ? ' activo' : '')}>
              <input
                type="radio"
                name="dir"
                checked={elegida === d.id}
                onChange={() => setElegida(d.id)}
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

      {/* Confirmar el envío a la dirección elegida */}
      {!agregando && direcciones.length > 0 && (
        <button
          className="btn btn-primario btn-bloque"
          style={{ marginTop: '1rem' }}
          onClick={confirmar}
        >
          Confirmar envío a esta dirección
        </button>
      )}
    </div>
  )
}
