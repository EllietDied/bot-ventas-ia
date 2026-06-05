// Funciones simples para guardar y leer datos en localStorage.
// Gracias a esto, la información se conserva aunque se cierre la app.

// Guarda cualquier dato convirtiéndolo a texto JSON.
export function guardar<T>(clave: string, valor: T): void {
  localStorage.setItem(clave, JSON.stringify(valor))
}

// Lee un dato. Si no existe, devuelve el valor por defecto.
export function cargar<T>(clave: string, porDefecto: T): T {
  const dato = localStorage.getItem(clave)
  if (dato === null) return porDefecto
  try {
    return JSON.parse(dato) as T
  } catch {
    return porDefecto
  }
}
