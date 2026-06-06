import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Proveedores de contexto (estado global de la aplicación).
import { SesionProvider } from './contexto/SesionContext'
import { ProductosProvider } from './contexto/ProductosContext'
import { ConsultasProvider } from './contexto/ConsultasContext'
import { CarritoProvider } from './contexto/CarritoContext'
import { PedidosProvider } from './contexto/PedidosContext'
import { MensajeriaProvider } from './contexto/MensajeriaContext'
import { ToastProvider } from './contexto/ToastContext'

// Punto de entrada: montamos la App envuelta en todos los contextos.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <ProductosProvider>
          <ConsultasProvider>
            <CarritoProvider>
              <PedidosProvider>
                <MensajeriaProvider>
                  <ToastProvider>
                    <App />
                  </ToastProvider>
                </MensajeriaProvider>
              </PedidosProvider>
            </CarritoProvider>
          </ConsultasProvider>
        </ProductosProvider>
      </SesionProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

// Registro del Service Worker (solo en producción) para habilitar la PWA.
// En desarrollo (npm run dev) no se registra, para no interferir con la recarga.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
