import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { BarraNavegacion } from './componentes/BarraNavegacion'
import { PieInstitucional } from './componentes/PieInstitucional'
import { RutaProtegida } from './componentes/RutaProtegida'
import { InkaAnimatedBackground } from './componentes/InkaAnimatedBackground'
import { useSesion } from './contexto/SesionContext'
import { Intro } from './paginas/Intro'
import { Login } from './paginas/Login'
import { Registro } from './paginas/Registro'
import { Catalogo } from './paginas/Catalogo'
import { Carrito } from './paginas/Carrito'
import { Checkout } from './paginas/Checkout'
import { Pedidos } from './paginas/Pedidos'
import { Asistente } from './paginas/Asistente'
import { PanelVendedor } from './paginas/PanelVendedor'
import { Mensajes } from './paginas/Mensajes'
import { Estadisticas } from './paginas/Estadisticas'
import { Billetera } from './paginas/Billetera'
import { Recuperar } from './paginas/Recuperar'
import { Restablecer } from './paginas/Restablecer'
import { Terminos } from './paginas/Terminos'
import { Privacidad } from './paginas/Privacidad'
import { LibroReclamaciones } from './paginas/LibroReclamaciones'
import { Devoluciones } from './paginas/Devoluciones'
import { Contacto } from './paginas/Contacto'

// Define las rutas (pantallas) de la aplicación.
export default function App() {
  const ubicacion = useLocation()
  const { usuarioActual } = useSesion()
  // El fondo global ambiental va solo en las páginas de la app (con sesión).
  // Intro, login y registro tienen su propio hero a sangre (.inka-auth-bg).
  const esAuth =
    ubicacion.pathname === '/login' ||
    ubicacion.pathname === '/registro' ||
    ubicacion.pathname === '/recuperar' ||
    ubicacion.pathname === '/restablecer'
  return (
    <>
      {usuarioActual && !esAuth && (
        <div className="inka-fondo-global" aria-hidden="true">
          {/* Versión ambiental: menos figuras y menos dorado que el login. El
              intervalo mayor da tiempo a que cada figura complete su dibujado de 7 s. */}
          <InkaAnimatedBackground total={70} activas={10} intervalo={750} />
        </div>
      )}
      <BarraNavegacion />
      <main className="contenedor">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/restablecer" element={<Restablecer />} />
          {/* Catálogo público: el visitante puede mirar sin iniciar sesión */}
          <Route path="/catalogo" element={<Catalogo />} />

          {/* Páginas legales públicas (requisito de la pasarela de pagos) */}
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="/libro-reclamaciones" element={<LibroReclamaciones />} />
          <Route path="/devoluciones" element={<Devoluciones />} />
          <Route path="/contacto" element={<Contacto />} />

          {/* Raíz: visitante ve la Intro pública; con sesión, la app (Asistente) */}
          <Route path="/" element={usuarioActual ? <Asistente /> : <Intro />} />

          {/* Rutas protegidas (requieren sesión) */}
          <Route
            path="/carrito"
            element={
              <RutaProtegida rol="comprador">
                <Carrito />
              </RutaProtegida>
            }
          />
          <Route
            path="/checkout"
            element={
              <RutaProtegida rol="comprador">
                <Checkout />
              </RutaProtegida>
            }
          />
          <Route
            path="/billetera"
            element={
              <RutaProtegida rol="comprador">
                <Billetera />
              </RutaProtegida>
            }
          />
          <Route
            path="/pedidos"
            element={
              <RutaProtegida>
                <Pedidos />
              </RutaProtegida>
            }
          />
          <Route
            path="/vendedor"
            element={
              <RutaProtegida rol="vendedor">
                <PanelVendedor />
              </RutaProtegida>
            }
          />
          <Route
            path="/mensajes"
            element={
              <RutaProtegida>
                <Mensajes />
              </RutaProtegida>
            }
          />
          <Route
            path="/estadisticas"
            element={
              <RutaProtegida rol="vendedor">
                <Estadisticas />
              </RutaProtegida>
            }
          />
          {/* Cualquier otra ruta vuelve al inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <PieInstitucional />
    </>
  )
}
