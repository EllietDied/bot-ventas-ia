import { Link } from 'react-router-dom'
import { LogoUSS } from './LogoUSS'

// Pie de página institucional (aparece en toda la app).
export function PieInstitucional() {
  return (
    <footer className="pie-institucional">
      <LogoUSS size="small" />
      <span>IA InkaShop · Respaldado por la Universidad Señor de Sipán · 2026</span>
      <span className="pie-enlaces">
        <Link to="/terminos">Términos y Condiciones</Link>
        <Link to="/privacidad">Política de Privacidad</Link>
      </span>
    </footer>
  )
}
