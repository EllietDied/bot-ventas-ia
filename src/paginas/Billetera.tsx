import { useState, useEffect } from 'react'
import { useSesion } from '../contexto/SesionContext'
import { useToast } from '../contexto/ToastContext'
import {
  cargarBilletera,
  guardarBilletera,
  aplicarRecarga,
  type EstadoBilletera,
} from '../core/servicios/BilleteraLocal'
import { usarPagosReales, crearPagoEfectivo, type PagoEfectivo } from '../core/servicios/PagosService'

// Montos rápidos de recarga (soles).
const MONTOS = [10, 20, 50, 100]

// Pantalla "Mi billetera": ver saldo, recargar y revisar movimientos.
export function Billetera() {
  const { usuarioActual } = useSesion()
  const toast = useToast()
  const idUsuario = usuarioActual?.idUsuario ?? ''
  const pagosReales = usarPagosReales()

  const [billetera, setBilletera] = useState<EstadoBilletera>(() => cargarBilletera(idUsuario))
  const [monto, setMonto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cip, setCip] = useState<PagoEfectivo | null>(null)

  // Cargamos la billetera del usuario actual al entrar.
  useEffect(() => {
    setBilletera(cargarBilletera(idUsuario))
  }, [idUsuario])

  async function recargar() {
    const valor = Number(monto)
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error('Ingresa un monto válido.')
      return
    }
    // En modo real, PagoEfectivo exige un mínimo de S/ 10.
    if (pagosReales && valor < 10) {
      toast.error('El monto mínimo para recargar por PagoEfectivo es S/ 10.')
      return
    }
    setCip(null)
    setCargando(true)
    try {
      if (pagosReales) {
        // Modo real: pedimos a la pasarela un código de PagoEfectivo.
        const pago = await crearPagoEfectivo({
          monto: valor,
          concepto: 'recarga',
          cliente: {
            nombre: usuarioActual?.nombre,
            apellido: usuarioActual?.apellido,
            email: usuarioActual?.correo,
            telefono: usuarioActual?.telefono,
          },
        })
        setCip(pago)
        toast.info('Generamos tu código de pago. Págalo para acreditar tu saldo.')
      } else {
        // Modo prueba (sin conexión): acreditamos el saldo al instante.
        const nuevo = aplicarRecarga(
          billetera,
          valor,
          'simulado',
          'mov-' + Date.now(),
          new Date().toISOString(),
        )
        setBilletera(nuevo)
        guardarBilletera(idUsuario, nuevo)
        toast.exito(`Recargaste S/ ${valor.toFixed(2)} (modo prueba).`)
      }
      setMonto('')
    } catch {
      toast.error('No se pudo procesar la recarga. Inténtalo de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="pagina">
      <header className="billetera-cabecera">
        <h1>Mi billetera</h1>
        <span className="ia-modo-badge" title="Modo de pagos" style={{ opacity: 0.7 }}>
          {pagosReales ? '● Pagos activos' : '○ Modo prueba'}
        </span>
      </header>

      {/* Saldo disponible */}
      <section className="tarjeta billetera-saldo">
        <span className="billetera-saldo-label">Saldo disponible</span>
        <span className="billetera-saldo-monto">S/ {billetera.saldo.toFixed(2)}</span>
      </section>

      {/* Recargar */}
      <section className="tarjeta">
        <h2 className="billetera-titulo">Recargar</h2>
        <div className="billetera-montos">
          {MONTOS.map((m) => (
            <button key={m} type="button" className="chip" onClick={() => setMonto(String(m))}>
              S/ {m}
            </button>
          ))}
        </div>
        <label className="campo">
          <span>Monto a recargar (S/)</span>
          <input
            type="text"
            inputMode="decimal"
            value={monto}
            placeholder="Ej. 50"
            onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ''))}
          />
        </label>
        <button
          className="btn btn-primario btn-bloque"
          disabled={cargando}
          onClick={recargar}
        >
          {cargando
            ? 'Procesando…'
            : pagosReales
            ? 'Recargar con PagoEfectivo'
            : 'Recargar (modo prueba)'}
        </button>
        {!pagosReales && (
          <p className="form-ayuda">
            Estás en modo prueba: la recarga es simulada y no cobra nada real.
          </p>
        )}
      </section>

      {/* Código CIP (solo en modo real, tras generar el pago) */}
      {cip && (
        <section className="tarjeta billetera-cip">
          <h2 className="billetera-titulo">Tu código de pago (CIP)</h2>
          <p className="billetera-cip-codigo">{cip.cip}</p>
          <p className="texto-tenue">
            Paga S/ {cip.monto.toFixed(2)} en cualquier agente, banca móvil o app de tu banco. Tu
            saldo se acreditará automáticamente al confirmarse el pago.
          </p>
          {cip.qr && <img className="billetera-qr" src={cip.qr} alt="Código QR de PagoEfectivo" />}
          {cip.url && (
            <a
              className="btn btn-secundario btn-bloque"
              href={cip.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir en PagoEfectivo
            </a>
          )}
        </section>
      )}

      {/* Movimientos */}
      <section className="tarjeta">
        <h2 className="billetera-titulo">Movimientos</h2>
        {billetera.movimientos.length === 0 ? (
          <p className="texto-tenue">Aún no tienes movimientos.</p>
        ) : (
          <ul className="billetera-movimientos">
            {billetera.movimientos.map((m) => (
              <li key={m.id} className="billetera-mov">
                <span>
                  <span className="billetera-mov-detalle">{m.detalle}</span>
                  <span className="billetera-mov-fecha">{new Date(m.fecha).toLocaleDateString()}</span>
                </span>
                <span className={'billetera-mov-monto ' + m.tipo}>
                  {m.tipo === 'recarga' ? '+ ' : '− '}S/ {m.monto.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
