import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { BarraNavegacion } from './componentes/BarraNavegacion'
import { PieInstitucional } from './componentes/PieInstitucional'
import { RutaProtegida } from './componentes/RutaProtegida'
import { InkaAnimatedBackground } from './componentes/InkaAnimatedBackground'
import { Login } from './paginas/Login'
import { Registro } from './paginas/Registro'
import { Catalogo } from './paginas/Catalogo'
import { Carrito } from './paginas/Carrito'
import { Checkout } from './paginas/Checkout'
import { Pedidos } from './paginas/Pedidos'
import { Asistente } from './paginas/Asistente'
import { PanelVendedor } from './paginas/PanelVendedor'
import { Mensajes } from './paginas/Mensajes'

// Define las rutas (pantallas) de la aplicación.
export default function App() {
  const ubicacion = useLocation()
  // En login/registro NO va el fondo global: esas páginas tienen su propio
  // hero a sangre (.inka-auth-bg). En el resto, una sola capa fija detrás de todo.
  const esAuth =
    ubicacion.pathname === '/login' || ubicacion.pathname === '/registro'
  return (
    <>
      {!esAuth && (
        <div className="inka-fondo-global" aria-hidden="true">
          {/* Versión ambiental: menos figuras y menos dorado que el login */}
          <InkaAnimatedBackground total={70} activas={10} />
        </div>
      )}
      <BarraNavegacion />
      <main className="contenedor">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas protegidas (requieren sesión) */}
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Asistente />
              </RutaProtegida>
            }
          />
          <Route
            path="/catalogo"
            element={
              <RutaProtegida>
                <Catalogo />
              </RutaProtegida>
            }
          />
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
          {/* Cualquier otra ruta vuelve al inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <PieInstitucional />
    </>
  )
}
