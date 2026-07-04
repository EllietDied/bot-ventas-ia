import { useEffect, useState } from 'react'
import { Direccion } from '../core/modelos/Direccion'
import {
  listarDirecciones,
  agregarDireccion,
  MAX_DIRECCIONES,
} from '../core/servicios/DireccionesService'
import { Icono } from './Icono'

interface Props {
  idUsuario: string
  // Datos para pre-llenar una dirección nueva (los del perfil del cliente).
  prefill?: { receptor?: string; telefono?: string; direccion?: string }
  // Se llama cada vez que cambia la dirección elegida (o null si aún no hay ninguna).
  onSeleccionar: (dir: Direccion | null) => void
}

// El cliente elige una de sus direcciones guardadas (hasta 3) o agrega una nueva,
// ANTES de pagar. Da feedback claro de a dónde se enviará el pedido.
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

  const elegidaObj = direcciones.find((d) => d.id === elegida) ?? null

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
      {direcciones.length > 0 && (
        <>
          <p className="envio-ayuda">Elige a dónde te lo enviamos:</p>
          <div className="direcciones-lista">
            {direcciones.map((d) => (
              <button
                type="button"
                key={d.id}
                className={'direccion-card' + (elegida === d.id ? ' activa' : '')}
                onClick={() => elegir(d)}
              >
                <span className="direccion-pin">
                  <Icono nombre="caja" size={18} />
                </span>
                <span className="direccion-info">
                  <strong>{d.receptor}</strong>
                  <span>
                    {d.direccion}
                    {d.referencia ? ` · ${d.referencia}` : ''}
                  </span>
                  {d.telefono && <span className="texto-tenue">📞 {d.telefono}</span>}
                </span>
                <span className="direccion-check">{elegida === d.id ? '✓' : ''}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {elegidaObj && !agregando && (
        <p className="envio-confirmado">
          <Icono nombre="check" size={14} /> Perfecto, lo enviaremos a{' '}
          <strong>{elegidaObj.receptor}</strong>.
        </p>
      )}

      {/* Formulario para una dirección nueva */}
      {agregando ? (
        <div className="direccion-form">
          <h3>
            {direcciones.length > 0 ? 'Agregar dirección' : 'Tu dirección de envío'}{' '}
            <span className="texto-tenue">
              ({direcciones.length}/{MAX_DIRECCIONES})
            </span>
          </h3>
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
            <input
              value={form.referencia}
              placeholder="Ej. frente al parque, casa azul…"
              onChange={(e) => set('referencia', e.target.value)}
            />
          </label>
          {error && <p className="mensaje-error">{error}</p>}
          <div className="direccion-form-botones">
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
          <button type="button" className="btn-agregar-dir" onClick={() => setAgregando(true)}>
            <Icono nombre="agregar" size={16} /> Agregar otra dirección
          </button>
        )
      )}
    </div>
  )
}
