import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../contexto/SesionContext'
import { useCarrito } from '../contexto/CarritoContext'
import { useMensajeria } from '../contexto/MensajeriaContext'
import { esVendedor } from '../core/modelos/Vendedor'
import { BotonInstalar } from './BotonInstalar'
import { BotonTema } from './BotonTema'
import { LogoUSS } from './LogoUSS'

// Barra superior de navegación. Muestra opciones según el rol del usuario.
export function BarraNavegacion() {
  const { usuarioActual, logout } = useSesion()
  const { cantidadTotal } = useCarrito()
  const { noLeidosDe } = useMensajeria()
  const navegar = useNavigate()

  // Mensajes recibidos sin leer del usuario actual (para el aviso).
  const noLeidos = usuarioActual ? noLeidosDe(usuarioActual.correo) : 0

  function cerrarSesion() {
    logout()
    navegar('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-marca">
        <LogoUSS size="small" />
        <span>IA InkaShop</span>
      </Link>

      <div className="navbar-links">
        {usuarioActual && (
          <>
            <Link to="/">Asistente IA</Link>
            <Link to="/catalogo">Explorar catálogo</Link>

            {/* Solo el comprador ve el carrito */}
            {!esVendedor(usuarioActual) && (
              <Link to="/carrito">
                Carrito{' '}
                {cantidadTotal > 0 && (
                  <span className="badge" key={cantidadTotal}>
                    {cantidadTotal}
                  </span>
                )}
              </Link>
            )}

            {/* Solo el vendedor ve su panel */}
            {esVendedor(usuarioActual) && <Link to="/vendedor">Panel Vendedor</Link>}

            <Link to="/mensajes">
              Mensajes{' '}
              {noLeidos > 0 && (
                <span className="badge" key={noLeidos}>
                  {noLeidos}
                </span>
              )}
            </Link>
            <Link to="/pedidos">Pedidos</Link>

            <span className="navbar-usuario">
              {usuarioActual.nombre} ({usuarioActual.rol})
            </span>
            <button className="btn btn-secundario btn-pequeno" onClick={cerrarSesion}>
              Salir
            </button>
          </>
        )}

        {/* Botón para instalar la PWA (aparece solo si el navegador lo permite) */}
        <BotonInstalar />

        {/* Botón para cambiar entre modo claro y oscuro */}
        <BotonTema />
      </div>
    </nav>
  )
}
