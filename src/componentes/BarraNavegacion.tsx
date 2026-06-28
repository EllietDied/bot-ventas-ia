import { Link, useNavigate, useLocation } from 'react-router-dom'
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
  const ubicacion = useLocation()

  // Mensajes recibidos sin leer del usuario actual (para el aviso).
  const noLeidos = usuarioActual ? noLeidosDe(usuarioActual.idUsuario) : 0

  function cerrarSesion() {
    logout()
    navegar('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-marca">
        <LogoUSS size="small" />
        <span className="navbar-marca-texto">
          <span className="marca-ia">IA</span> <span className="marca-shop">InkaShop</span>
        </span>
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
            {!esVendedor(usuarioActual) && <Link to="/billetera">Billetera</Link>}

            {/* Solo el vendedor ve su panel y sus estadísticas */}
            {esVendedor(usuarioActual) && <Link to="/vendedor">Panel Vendedor</Link>}
            {esVendedor(usuarioActual) && <Link to="/estadisticas">Estadísticas</Link>}

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

        {/* Visitante (sin sesión): puede explorar el catálogo y entrar */}
        {!usuarioActual && <Link to="/catalogo">Explorar catálogo</Link>}
        {!usuarioActual && ubicacion.pathname !== '/login' && (
          <Link to="/login" className="btn btn-primario btn-pequeno">
            Iniciar sesión
          </Link>
        )}

        {/* Botón para instalar la PWA (aparece solo si el navegador lo permite) */}
        <BotonInstalar />

        {/* Botón para cambiar entre modo claro y oscuro */}
        <BotonTema />
      </div>
    </nav>
  )
}
