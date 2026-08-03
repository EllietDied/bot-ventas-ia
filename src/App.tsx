import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { BarraNavegacion } from './componentes/BarraNavegacion'
import { ScrollToTop } from './componentes/ScrollToTop'
import { PieInstitucional } from './componentes/PieInstitucional'
import { RutaProtegida } from './componentes/RutaProtegida'
import { InkaAnimatedBackground } from './componentes/InkaAnimatedBackground'
import { useSesion } from './contexto/SesionContext'

// Cada pantalla se descarga únicamente al visitar su ruta.
const Intro = lazy(() => import('./paginas/Intro').then((m) => ({ default: m.Intro })))
const Login = lazy(() => import('./paginas/Login').then((m) => ({ default: m.Login })))
const Registro = lazy(() => import('./paginas/Registro').then((m) => ({ default: m.Registro })))
const Catalogo = lazy(() => import('./paginas/Catalogo').then((m) => ({ default: m.Catalogo })))
const DetalleProducto = lazy(() =>
  import('./paginas/DetalleProducto').then((m) => ({ default: m.DetalleProducto })),
)
const Carrito = lazy(() => import('./paginas/Carrito').then((m) => ({ default: m.Carrito })))
const Checkout = lazy(() => import('./paginas/Checkout').then((m) => ({ default: m.Checkout })))
const Pedidos = lazy(() => import('./paginas/Pedidos').then((m) => ({ default: m.Pedidos })))
const PedidoDetalle = lazy(() =>
  import('./paginas/PedidoDetalle').then((m) => ({ default: m.PedidoDetalle })),
)
const Asistente = lazy(() => import('./paginas/Asistente').then((m) => ({ default: m.Asistente })))
const PanelVendedor = lazy(() =>
  import('./paginas/PanelVendedor').then((m) => ({ default: m.PanelVendedor })),
)
const EditarProducto = lazy(() =>
  import('./paginas/EditarProducto').then((m) => ({ default: m.EditarProducto })),
)
const DetalleInventario = lazy(() =>
  import('./paginas/DetalleInventario').then((m) => ({ default: m.DetalleInventario })),
)
const DetalleVentas = lazy(() =>
  import('./paginas/DetalleVentas').then((m) => ({ default: m.DetalleVentas })),
)
const Mensajes = lazy(() => import('./paginas/Mensajes').then((m) => ({ default: m.Mensajes })))
const Estadisticas = lazy(() =>
  import('./paginas/Estadisticas').then((m) => ({ default: m.Estadisticas })),
)
const Billetera = lazy(() => import('./paginas/Billetera').then((m) => ({ default: m.Billetera })))
const Recuperar = lazy(() => import('./paginas/Recuperar').then((m) => ({ default: m.Recuperar })))
const Restablecer = lazy(() =>
  import('./paginas/Restablecer').then((m) => ({ default: m.Restablecer })),
)
const Terminos = lazy(() => import('./paginas/Terminos').then((m) => ({ default: m.Terminos })))
const Privacidad = lazy(() =>
  import('./paginas/Privacidad').then((m) => ({ default: m.Privacidad })),
)
const LibroReclamaciones = lazy(() =>
  import('./paginas/LibroReclamaciones').then((m) => ({ default: m.LibroReclamaciones })),
)
const Devoluciones = lazy(() =>
  import('./paginas/Devoluciones').then((m) => ({ default: m.Devoluciones })),
)
const Contacto = lazy(() => import('./paginas/Contacto').then((m) => ({ default: m.Contacto })))

function CargandoRuta() {
  return (
    <div className="ruta-cargando" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>Cargando…</span>
    </div>
  )
}

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
      <ScrollToTop />
      {usuarioActual && !esAuth && (
        <div className="inka-fondo-global" aria-hidden="true">
          {/* Versión ambiental: menos figuras y menos dorado que el login. El
              intervalo mayor da tiempo a que cada figura complete su dibujado de 7 s. */}
          <InkaAnimatedBackground total={28} activas={2} intervalo={2300} />
        </div>
      )}
      <BarraNavegacion />
      <main className="contenedor">
        <Suspense fallback={<CargandoRuta />}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/recuperar" element={<Recuperar />} />
            <Route path="/restablecer" element={<Restablecer />} />
            {/* Catálogo público: el visitante puede mirar sin iniciar sesión */}
            <Route path="/catalogo" element={<Catalogo />} />
            {/* Detalle de un producto (público, se abre al hacer clic en una tarjeta) */}
            <Route path="/producto/:id" element={<DetalleProducto />} />

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
              path="/pedidos/:id"
              element={
                <RutaProtegida>
                  <PedidoDetalle />
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
              path="/vendedor/editar/:id"
              element={
                <RutaProtegida rol="vendedor">
                  <EditarProducto />
                </RutaProtegida>
              }
            />
            <Route
              path="/vendedor/inventario"
              element={
                <RutaProtegida rol="vendedor">
                  <DetalleInventario />
                </RutaProtegida>
              }
            />
            <Route
              path="/vendedor/ventas"
              element={
                <RutaProtegida rol="vendedor">
                  <DetalleVentas />
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
        </Suspense>
      </main>
      <PieInstitucional />
    </>
  )
}
