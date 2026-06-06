// Logo oficial de la Universidad Señor de Sipán (componente reutilizable).
// Se muestra dentro de una CAJA BLANCA para que se vea correctamente también
// en modo oscuro (el logo es de color oscuro). Mantiene su proporción original
// (object-fit: contain), sin estirarse ni recortarse.

interface Props {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
}

// Altura del logo (px) según el tamaño elegido.
const ALTURAS: Record<'small' | 'medium' | 'large', number> = {
  small: 26,
  medium: 52,
  large: 84,
}

export function LogoUSS({ size = 'medium', showText = false }: Props) {
  const alto = ALTURAS[size]
  return (
    <span className="logo-uss">
      <span className="logo-uss-caja">
        <img
          src="/logo-uss.png"
          alt="Universidad Señor de Sipán"
          className="logo-uss-img"
          style={{ height: alto }}
        />
      </span>
      {showText && <span className="logo-uss-texto">Universidad Señor de Sipán</span>}
    </span>
  )
}
