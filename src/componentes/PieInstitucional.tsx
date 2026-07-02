import { Link } from 'react-router-dom'
import { LogoUSS } from './LogoUSS'
import { DATOS_NEGOCIO } from '../core/datos/negocio'

// Pie de página institucional (aparece en toda la app).
export function PieInstitucional() {
  return (
    <footer className="pie-institucional">
      <LogoUSS size="small" />
      <span>IA InkaShop · Respaldado por la Universidad Señor de Sipán · 2026</span>
      <span className="pie-contacto">
        {DATOS_NEGOCIO.nombre} · RUC {DATOS_NEGOCIO.ruc} · Tel: {DATOS_NEGOCIO.telefono} ·{' '}
        {DATOS_NEGOCIO.correo}
      </span>
      <span className="pie-enlaces">
        <Link to="/contacto">Contacto</Link>
        <Link to="/terminos">Términos y Condiciones</Link>
        <Link to="/privacidad">Política de Privacidad</Link>
        <Link to="/devoluciones">Cambios y Devoluciones</Link>
        <Link to="/libro-reclamaciones">📕 Libro de Reclamaciones</Link>
      </span>
    </footer>
  )
}
