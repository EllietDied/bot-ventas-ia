// scripts/probar-culqi.mjs
// -----------------------------------------------------------------------------
// Prueba LOCAL de las llaves de Culqi (sandbox), SIN tocar la app ni desplegar.
// Confirma que:
//   1) la llave PÚBLICA tokeniza una tarjeta de prueba (lo usará el checkout),
//   2) la llave SECRETA puede crear una ORDEN de PagoEfectivo (genera un CIP),
//      que es justo el flujo de "recargar la billetera con efectivo".
//
// Uso:  node scripts/probar-culqi.mjs     (lee las llaves de .env.local)
// Requiere Node 18+ (fetch nativo). No mueve dinero real (son llaves de prueba).
// -----------------------------------------------------------------------------

import { readFileSync } from 'node:fs'

function cargarEnv(archivo) {
  try {
    for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
      const l = linea.trim()
      if (!l || l.startsWith('#')) continue
      const i = l.indexOf('=')
      if (i === -1) continue
      const clave = l.slice(0, i).trim()
      let valor = l.slice(i + 1).trim()
      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1)
      }
      if (!(clave in process.env)) process.env[clave] = valor
    }
  } catch {
    /* el archivo puede no existir */
  }
}
cargarEnv('.env.local')
cargarEnv('.env')

const PK = process.env.VITE_CULQI_PUBLIC_KEY
const SK = process.env.CULQI_SECRET_KEY
if (!PK || !SK) {
  console.error('❌ Faltan VITE_CULQI_PUBLIC_KEY o CULQI_SECRET_KEY en .env.local')
  process.exit(1)
}
console.log('Probando Culqi (sandbox)')
console.log('  pública:', PK.slice(0, 13) + '…')
console.log('  secreta:', SK.slice(0, 13) + '…\n')

// --- 1) Tokenizar una tarjeta de PRUEBA con la llave pública ---
async function probarToken() {
  try {
    const r = await fetch('https://secure.culqi.com/v2/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + PK },
      body: JSON.stringify({
        card_number: '4111111111111111', // tarjeta de prueba Culqi
        cvv: '123',
        expiration_month: 9,
        expiration_year: 2030,
        email: 'prueba@inkashop.com',
      }),
    })
    const d = await r.json()
    if (r.ok && d.id) {
      console.log('✔ Llave PÚBLICA OK — token de tarjeta:', d.id)
      return true
    }
    console.log('✖ Llave pública:', r.status, JSON.stringify(d).slice(0, 300))
    return false
  } catch (e) {
    console.log('✖ Error de red (token):', e.message)
    return false
  }
}

// --- 2) Crear una ORDEN de PagoEfectivo con la llave secreta (genera un CIP) ---
async function probarOrden() {
  try {
    const r = await fetch('https://api.culqi.com/v2/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + SK },
      body: JSON.stringify({
        amount: 1000, // S/ 10.00 (en céntimos)
        currency_code: 'PEN',
        description: 'Recarga de prueba InkaShop',
        order_number: 'test-' + Date.now(),
        client_details: {
          first_name: 'QA',
          last_name: 'Prueba',
          email: 'prueba@inkashop.com',
          phone_number: '949080417',
        },
        expiration_date: Math.floor(Date.now() / 1000) + 3 * 24 * 3600, // +3 días
        confirm: false,
      }),
    })
    const d = await r.json()
    if (r.ok && d.id) {
      console.log('✔ Llave SECRETA OK — orden creada:', d.id)
      console.log('  CIP (código PagoEfectivo):', d.payment_code ?? d.cip ?? '(revisa la respuesta)')
      return true
    }
    console.log('✖ Llave secreta / orden:', r.status, JSON.stringify(d).slice(0, 400))
    return false
  } catch (e) {
    console.log('✖ Error de red (orden):', e.message)
    return false
  }
}

const okPk = await probarToken()
const okSk = await probarOrden()
console.log('\n============================================')
if (okPk && okSk) {
  console.log('✅ Ambas llaves funcionan. Listo para construir la integración.')
} else if (okSk) {
  console.log('⚠ La SECRETA funciona (lo principal para el backend). Revisa la pública arriba.')
} else {
  console.log('⚠ Revisa los errores de arriba antes de seguir.')
}
console.log('============================================')
