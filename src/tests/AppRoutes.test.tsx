// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../App'
import { SesionProvider } from '../contexto/SesionContext'
import { ProductosProvider } from '../contexto/ProductosContext'
import { ConsultasProvider } from '../contexto/ConsultasContext'
import { CarritoProvider } from '../contexto/CarritoContext'
import { PedidosProvider } from '../contexto/PedidosContext'
import { MensajeriaProvider } from '../contexto/MensajeriaContext'
import { ToastProvider } from '../contexto/ToastContext'

function RutaActual() {
  const ubicacion = useLocation()
  return <output data-testid="ruta-actual">{ubicacion.pathname}</output>
}

function renderizarApp(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider>
        <ProductosProvider>
          <ConsultasProvider>
            <CarritoProvider>
              <PedidosProvider>
                <MensajeriaProvider>
                  <ToastProvider>
                    <App />
                    <RutaActual />
                  </ToastProvider>
                </MensajeriaProvider>
              </PedidosProvider>
            </CarritoProvider>
          </ConsultasProvider>
        </ProductosProvider>
      </SesionProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.setAttribute('data-theme', 'light')
  window.scrollTo = () => {}
  Element.prototype.scrollTo = () => {}
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('rutas principales de la aplicación', () => {
  it('muestra la portada pública a un visitante', async () => {
    renderizarApp('/')

    expect(
      await screen.findByRole('heading', {
        name: 'Compra con respaldo, vende con innovación',
      }),
    ).toBeVisible()
    expect(screen.getAllByRole('link', { name: 'Crear cuenta gratis' })).toHaveLength(2)
  })

  it('permite abrir el catálogo sin iniciar sesión', async () => {
    renderizarApp('/catalogo')

    expect(await screen.findByRole('heading', { name: 'Explorar catálogo' })).toBeVisible()
    expect(screen.getByPlaceholderText('Buscar producto o categoría...')).toBeEnabled()
    expect(screen.getByRole('button', { name: /Buscar por foto/ })).toBeEnabled()
  })

  it('redirige una ruta protegida al inicio cuando no hay sesión', async () => {
    renderizarApp('/carrito')

    expect(
      await screen.findByRole('heading', {
        name: 'Compra con respaldo, vende con innovación',
      }),
    ).toBeVisible()
    expect(screen.queryByRole('heading', { name: /carrito/i })).not.toBeInTheDocument()
  })

  it('valida el formulario de acceso antes de autenticar', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/login')

    await usuario.click(await screen.findByRole('button', { name: 'Ingresar' }))

    expect(screen.getByText('Completa todos los campos.')).toBeVisible()
  })

  it('inicia sesión con la cuenta demo del comprador', async () => {
    const usuario = userEvent.setup()
    renderizarApp('/login')

    await usuario.type(await screen.findByLabelText('Correo'), 'comprador@demo.com')
    await usuario.type(screen.getByLabelText('Contraseña'), '123456')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => expect(screen.getByTestId('ruta-actual')).toHaveTextContent('/'))
    expect(await screen.findByText(/Beryher \(comprador\)/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Carrito' })).toBeVisible()
  })
})
