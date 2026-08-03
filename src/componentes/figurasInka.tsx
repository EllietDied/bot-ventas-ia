// Biblioteca visual del fondo de InkaShop.
// Los símbolos comparten una retícula 64×64, una huella óptica de 48×48 y
// geometría simétrica para conservar claridad tanto en fondo como en primer plano.
export const FORMAS_INKA: Record<string, () => JSX.Element> = {
  chakana: () => (
    <>
      <path
        pathLength={1}
        d="M26 8 H38 V19 H49 V26 H56 V38 H49 V45 H38 V56 H26 V45 H15 V38 H8 V26 H15 V19 H26 Z"
      />
      <circle pathLength={1} cx="32" cy="32" r="7" />
      <path pathLength={1} d="M32 25 V39 M25 32 H39" />
    </>
  ),

  sol: () => (
    <>
      <circle pathLength={1} cx="32" cy="32" r="14" />
      <circle pathLength={1} cx="32" cy="32" r="6" />
      <path pathLength={1} d="M32 7 V13 M32 51 V57 M7 32 H13 M51 32 H57" />
      <path pathLength={1} d="M14.5 14.5 L19 19 M45 45 L49.5 49.5 M49.5 14.5 L45 19 M19 45 L14.5 49.5" />
      <path pathLength={1} d="M32 28 L36 32 L32 36 L28 32 Z" />
    </>
  ),

  condor: () => (
    <>
      <path
        pathLength={1}
        d="M29 27 C23 21 16 18 8 20 C14 24 20 29 25 36 C27 39 29 42 32 46"
      />
      <path
        pathLength={1}
        d="M35 27 C41 21 48 18 56 20 C50 24 44 29 39 36 C37 39 35 42 32 46"
      />
      <path pathLength={1} d="M13 21 C19 24 25 31 30 41 M51 21 C45 24 39 31 34 41" />
      <circle pathLength={1} cx="32" cy="21" r="3.5" />
      <path pathLength={1} d="M29 23 L32 27 L35 23" />
      <path pathLength={1} d="M32 27 C28 34 29 43 32 49 C35 43 36 34 32 27 Z" />
      <path pathLength={1} d="M25 48 L32 56 L39 48" />
    </>
  ),

  tumi: () => (
    <>
      <path pathLength={1} d="M19 16 Q32 4 45 16 M23 14 Q32 8 41 14" />
      <rect pathLength={1} x="24" y="14" width="16" height="15" rx="3" />
      <circle pathLength={1} cx="22" cy="22" r="2.5" />
      <circle pathLength={1} cx="42" cy="22" r="2.5" />
      <path pathLength={1} d="M27 20 H30 M34 20 H37 M29 25 H35" />
      <path pathLength={1} d="M27 29 V35 H37 V29 M29 32 H35" />
      <path pathLength={1} d="M9 36 H55 C53 47 45 55 32 59 C19 55 11 47 9 36 Z" />
      <path pathLength={1} d="M16 42 Q32 49 48 42" />
    </>
  ),

  quipu: () => (
    <>
      <path pathLength={1} d="M9 15 Q32 8 55 15" />
      <path pathLength={1} d="M16 13 C16 25 15 39 16 51 M24 11 C24 22 25 32 24 43 M32 10 C31 25 33 40 32 54 M40 11 C40 22 39 32 40 43 M48 13 C48 25 49 39 48 51" />
      <circle pathLength={1} cx="16" cy="29" r="2.5" />
      <circle pathLength={1} cx="24" cy="25" r="2.5" />
      <circle pathLength={1} cx="32" cy="32" r="2.5" />
      <circle pathLength={1} cx="40" cy="25" r="2.5" />
      <circle pathLength={1} cx="48" cy="29" r="2.5" />
      <circle pathLength={1} cx="16" cy="52" r="3" />
      <circle pathLength={1} cx="32" cy="55" r="3" />
      <circle pathLength={1} cx="48" cy="52" r="3" />
    </>
  ),

  montanas: () => (
    <>
      <path pathLength={1} d="M5 43 L18 31 L23 34 L37 16 L47 29 L51 25 L59 38" />
      <path pathLength={1} d="M28 29 L37 16 L45 28 L41 25 L37 31 L33 25 Z" />
      <path pathLength={1} d="M13 35 L18 31 L23 34 L20 33 L18 36 L16 33 Z" />
      <path pathLength={1} d="M46 29 L51 25 L56 34 L52 31 L50 34 L48 30 Z" />
      <path pathLength={1} d="M8 45 Q20 39 30 42 Q37 44 44 41 Q51 39 58 43" />
      <path pathLength={1} d="M6 49 Q20 44 32 47 Q44 44 58 48" />
      <path pathLength={1} d="M12 52 Q32 47 52 52" />
    </>
  ),

  intihuatana: () => (
    <>
      <path pathLength={1} d="M8 56 H56" />
      <path pathLength={1} d="M13 56 L16 48 H48 L51 56 Z" />
      <path pathLength={1} d="M16 48 L20 40 H44 L48 48 Z" />
      <path pathLength={1} d="M20 40 L24 32 H40 L44 40 Z" />
      <path pathLength={1} d="M27 32 V12 H37 V32 M27 20 H37" />
      <path pathLength={1} d="M32 12 V7" />
    </>
  ),

  wiphala: () => (
    <>
      <rect pathLength={1} x="10" y="10" width="44" height="44" rx="2" />
      <path pathLength={1} d="M10 24.7 H54 M10 39.3 H54 M24.7 10 V54 M39.3 10 V54" />
      <path pathLength={1} d="M10 54 L54 10 M24.7 54 L54 24.7 M10 39.3 L39.3 10" />
      <path pathLength={1} d="M10 24.7 L24.7 10 M39.3 54 L54 39.3" />
    </>
  ),

  greca: () => (
    <>
      <path
        pathLength={1}
        d="M10 42 C10 25 20 15 33 15 C45 15 53 23 53 33 C53 42 46 49 37 49 C29 49 23 44 23 37 C23 31 27 27 33 27 C38 27 41 30 41 34 C41 37 39 39 36 39"
      />
      <circle pathLength={1} cx="36" cy="39" r="2" />
    </>
  ),

  rombos: () => (
    <>
      <path pathLength={1} d="M8 32 L20 18 L32 32 L20 46 Z" />
      <path pathLength={1} d="M32 32 L44 18 L56 32 L44 46 Z" />
      <path pathLength={1} d="M14 32 L20 25 L26 32 L20 39 Z M38 32 L44 25 L50 32 L44 39 Z" />
      <path pathLength={1} d="M8 32 H56" />
      <circle pathLength={1} cx="20" cy="32" r="2" />
      <circle pathLength={1} cx="44" cy="32" r="2" />
    </>
  ),

  aribalo: () => (
    <>
      <path
        pathLength={1}
        d="M17 24 C15 14 17 6 23 6 C29 6 30 14 29 24 M35 24 C34 14 35 6 41 6 C47 6 49 14 47 24"
      />
      <path
        pathLength={1}
        d="M14 24 H50 C50 36 45 46 37 54 L34 58 H30 L27 54 C19 46 14 36 14 24 Z"
      />
      <path pathLength={1} d="M14 28 H50 M16 42 H48" />
      <path pathLength={1} d="M18 39 V31 H27 V39 H21 V34 H24" />
      <path pathLength={1} d="M28 39 V31 H37 V39 H31 V34 H34" />
      <path pathLength={1} d="M38 39 V31 H47 V39 H41 V34 H44" />
      <path pathLength={1} d="M28 58 H36" />
    </>
  ),

  kero: () => (
    <>
      <path pathLength={1} d="M17 10 Q32 7 47 10 L43 54 Q32 57 21 54 Z" />
      <path pathLength={1} d="M19 22 Q32 25 45 22 M20 39 Q32 42 44 39 M22 49 Q32 52 42 49" />
      <path pathLength={1} d="M22 23 Q26 32 28 39 M30 25 Q32 32 34 40 M39 24 Q37 32 36 40" />
    </>
  ),

  chaska: () => (
    <>
      <path
        pathLength={1}
        d="M32 8 C34 23 41 30 56 32 C41 34 34 41 32 56 C30 41 23 34 8 32 C23 30 30 23 32 8 Z"
      />
      <circle pathLength={1} cx="32" cy="32" r="6" />
      <path pathLength={1} d="M16 16 L20 20 M48 16 L44 20 M16 48 L20 44 M48 48 L44 44" />
    </>
  ),

  cruzdelsur: () => (
    <>
      <path pathLength={1} d="M19 20 L31 29 L44 17 M31 29 L39 44 M31 29 L18 41" />
      <circle pathLength={1} cx="19" cy="20" r="4" />
      <circle pathLength={1} cx="44" cy="17" r="5" />
      <circle pathLength={1} cx="31" cy="29" r="4.5" />
      <circle pathLength={1} cx="18" cy="41" r="3.5" />
      <circle pathLength={1} cx="39" cy="44" r="4" />
      <circle pathLength={1} cx="50" cy="36" r="2" />
    </>
  ),

  llama: () => (
    <>
      <path
        pathLength={1}
        d="M9 12 C11 9 15 7 19 7 C22 6 25 8 29 10 C30 11 29 13 27 14 L23 15 C25 19 25 23 25 28 C32 25 40 26 48 27 C55 28 58 32 58 38 C58 41 57 44 56 46 C55 48 53 47 53 45 C52 50 52 55 50 58 C48 60 45 60 44 58 C47 55 48 50 48 45 C44 44 40 43 37 43 C35 48 35 54 34 59 C32 61 29 61 27 59 C29 56 29 50 28 45 C25 44 22 43 20 42 C20 48 21 54 20 59 C18 61 15 61 13 59 C15 56 15 49 14 43 C10 40 8 35 8 30 C8 24 9 18 12 15 C9 15 7 14 7 13 C7 12 8 12 9 12 Z"
      />
      <path pathLength={1} d="M18 8 C20 5 24 5 27 8 M22 10 C25 8 28 9 30 10" />
      <path pathLength={1} d="M8 14 Q11 16 15 14" />
      <path pathLength={1} d="M13 22 C11 28 12 35 17 39" />
      <path pathLength={1} d="M42 43 C40 48 42 54 40 58 C39 60 41 61 44 58" />
      <path pathLength={1} d="M24 44 C25 49 25 55 24 58" />
    </>
  ),

  nawi: () => (
    <>
      <path pathLength={1} d="M8 32 Q32 13 56 32 Q32 51 8 32 Z" />
      <circle pathLength={1} cx="32" cy="32" r="10" />
      <circle pathLength={1} cx="32" cy="32" r="4" />
      <path pathLength={1} d="M16 18 L12 12 M26 14 L24 8 M38 14 L40 8 M48 18 L52 12" />
      <path pathLength={1} d="M16 46 L12 52 M26 50 L24 56 M38 50 L40 56 M48 46 L52 52" />
    </>
  ),
}

export const NOMBRES_FIGURAS_INKA = Object.freeze(Object.keys(FORMAS_INKA))
