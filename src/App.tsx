import { Routes, Route, Navigate } from 'react-router-dom'
import { BarraNavegacion } from './componentes/BarraNavegacion'
import { RutaProtegida } from './componentes/RutaProtegida'
import { Login } from './paginas/Login'
import { Registro } from './paginas/Registro'
import { Catalogo } from './paginas/Catalogo'
import { Carrito } from './paginas/Carrito'
import { Checkout } from './paginas/Checkout'
import { Pedidos } from './paginas/Pedidos'
import { Chat } from './paginas/Chat'
import { PanelVendedor } from './paginas/PanelVendedor'
import { Evidencia } from './paginas/Evidencia'
import { Mensajes } from './paginas/Mensajes'

// Define las rutas (pantallas) de la aplicación.
export default function App() {
  return (
    <>
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
                <Catalogo />
              </RutaProtegida>
            }
          />
          <Route
            path="/chat"
            element={
              <RutaProtegida>
                <Chat />
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
          <Route
            path="/evidencia"
            element={
              <RutaProtegida>
                <Evidencia />
              </RutaProtegida>
            }
          />

          {/* Cualquier otra ruta vuelve al inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
