import { LogoUSS } from './LogoUSS'

// Pie de página institucional (aparece en toda la app).
export function PieInstitucional() {
  return (
    <footer className="pie-institucional">
      <LogoUSS size="small" />
      <span>IA InkaShop · Respaldado por la Universidad Señor de Sipán · 2026</span>
    </footer>
  )
}
