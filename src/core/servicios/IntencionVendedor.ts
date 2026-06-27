// IntencionVendedor.ts
// Cuando el vendedor escribe algo DENTRO de un flujo guiado (por ejemplo, mientras se
// le pide el nombre de un producto), no siempre está dando el dato: a veces se
// arrepiente, se equivoca o quiere cambiar de operación. Estas funciones detectan esos
// casos para que el asistente NO tome la frase como dato por error.
// Lógica pura (sin React), fácil de probar con Vitest.

export type OperacionVendedor = 'agregar' | 'modificar' | 'eliminar' | 'ver'

// Pasa a minúsculas y quita las tildes, para comparar de forma flexible.
function limpiar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

// ¿El vendedor quiere CANCELAR lo que está haciendo?
export function quiereCancelar(texto: string): boolean {
  const t = limpiar(texto)
  if (/\b(cancelar|cancela|cancelo|salir|abortar|anular|anula)\b/.test(t)) return true
  return /(olvidalo|olvida eso|dejalo|dejemoslo|ya no quiero|\bya no\b|mejor no|me arrepent|no importa|deja eso)/.test(t)
}

// ¿Qué operación menciona el texto? (null si no menciona ninguna)
export function operacionMencionada(texto: string): OperacionVendedor | null {
  const t = limpiar(texto)
  if (/\b(modificar|modifica|modifico|modifique|editar|edita|edito)\b/.test(t)) return 'modificar'
  if (/\b(eliminar|elimina|elimino|elimine|borrar|borra|borro|quitar|quita|quito)\b/.test(t)) return 'eliminar'
  if (/\b(agregar|agrega|agrego|agregue|publicar|publica|publico|crear|crea|nuevo|otro)\b/.test(t)) return 'agregar'
  if (/(mis productos|ver mis|ver productos|que tengo|mis articulos)/.test(t)) return 'ver'
  return null
}

// ¿La frase expresa INTENCIÓN DE CAMBIAR (no es un simple dato)?
// Se combina con operacionMencionada(): intención + operación = cambio claro.
export function esIntencionDeCambio(texto: string): boolean {
  const t = limpiar(texto)
  return /\b(no|mejor|prefiero|quiero|quisiera|deseo|en vez|en lugar|me equivoque|equivoque|en realidad)\b/.test(t)
}

// ¿Parece una DUDA o un arrepentimiento, sin una operación clara?
export function pareceDuda(texto: string): boolean {
  const t = limpiar(texto)
  return (
    /(me equivoque|equivoque|no era eso|no es eso|perdon|espera|esperate|ayudame|\bayuda\b|no se que|no se como|no entiendo|estoy confundid|que hago|me confund|no estoy segur)/.test(
      t,
    ) || /^(no|uy|ups|eh|este)\b/.test(t)
  )
}

// Texto legible de la operación, para los mensajes del asistente.
export function etiquetaOperacion(op: OperacionVendedor): string {
  switch (op) {
    case 'agregar':
      return 'agregar un producto'
    case 'modificar':
      return 'modificar un producto'
    case 'eliminar':
      return 'eliminar un producto'
    case 'ver':
      return 'ver tus productos'
  }
}
