// Service Worker de la PWA "IA InkaShop".
// Su trabajo es guardar en caché los archivos principales para que la app
// cargue rápido y pueda abrirse incluso sin conexión.
// (No toca la lógica de negocio: solo es la capa de entrega.)

const CACHE = 'inkashop-v10'

// Archivos base de la app (con nombres estables).
const ARCHIVOS_BASE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-uss.png',
]

// Al INSTALAR: guardamos los archivos base en la caché.
self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS_BASE)))
  self.skipWaiting()
})

// Al ACTIVAR: borramos cachés de versiones anteriores.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
      ),
  )
  self.clients.claim()
})

// Al PEDIR un archivo:
self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET') return

  // SOLO gestionamos archivos del MISMO ORIGEN (los de la app).
  // Las llamadas a APIs externas (Supabase, IA, modelos) deben ir SIEMPRE a la
  // red y NUNCA cachearse: si no, se serviría una respuesta vieja (p. ej. el
  // catálogo vacío) aunque la base ya tenga datos nuevos.
  if (new URL(peticion.url).origin !== self.location.origin) return

  // Para la navegación (HTML): primero la red; si falla, usamos la caché (offline).
  if (peticion.mode === 'navigate') {
    evento.respondWith(fetch(peticion).catch(() => caches.match('/index.html')))
    return
  }

  // Para el resto (JS, CSS, imágenes): primero la caché; si no está, la red
  // (y guardamos una copia para la próxima vez).
  evento.respondWith(
    caches.match(peticion).then((cacheado) => {
      if (cacheado) return cacheado
      return fetch(peticion).then((respuesta) => {
        const copia = respuesta.clone()
        caches.open(CACHE).then((cache) => cache.put(peticion, copia))
        return respuesta
      })
    }),
  )
})
