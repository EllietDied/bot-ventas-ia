# ▶️ Cómo ejecutar — Bot de Ventas IA

Guía rápida de una página para correr el proyecto. *(Versión más detallada en el [README](README.md)).*

---

## ✅ Requisitos
- **Node.js 18 o superior** (recomendado LTS 20+). Descárgalo de [nodejs.org](https://nodejs.org). Incluye `npm`.
- Un navegador moderno (Chrome, Edge, Firefox…).

## 📦 Instalación (solo la primera vez)
Abre una terminal **dentro de la carpeta del proyecto** (donde está `package.json`) y ejecuta:
```bash
npm install
```

## 💻 Ejecución local (desarrollo)
```bash
npm run dev
```
Abre la dirección que muestra la consola: **http://localhost:5173**
Para detener: `Ctrl + C`.

## 🏗️ Compilación (versión de producción)
```bash
npm run build      # genera la carpeta dist/ (optimizada)
npm run preview    # sirve esa versión en http://localhost:4173
```
> Para probar la **PWA** (instalación, service worker), usa `npm run build` + `npm run preview`,
> **no** `npm run dev` (en desarrollo el service worker está desactivado a propósito).

## 👤 Cuentas demo
| Rol | Correo | Contraseña |
|-----|--------|------------|
| Comprador | `comprador@demo.com` | `123456` |
| Vendedor | `vendedor@demo.com` | `123456` |

> Para empezar con datos frescos: F12 → **Application** → **Local Storage** → **Clear**.

---

## 🎓 Identidad institucional

La aplicación incluye el **logo oficial de la Universidad Señor de Sipán** (`public/logo-uss.png`) en la
barra de navegación, el login, el registro, el asistente, la evidencia académica y el pie de página,
así como en los **iconos de la PWA**. *(Si necesitas otra versión del logo, reemplaza `public/logo-uss.png`).*

---

## 🌗 Modo claro / oscuro

La app incluye **modo claro y oscuro**. Usa el botón **☀️ / 🌙** de la barra de navegación para cambiar.
- La preferencia se **guarda** (`localStorage`) y se aplica automáticamente al volver a abrir la app.
- Si nunca lo cambiaste, la app respeta el **tema de tu sistema** (claro u oscuro).

---

## 📱 Instalar la PWA (app instalable)

La aplicación es una **PWA**: se puede instalar como si fuera una app, en PC y celular.
La opción de instalar aparece cuando la app se sirve por **HTTPS** (por ejemplo en Vercel) o en
**localhost con el build de producción** (`npm run preview`).

- **PC (Chrome / Edge):** pulsa el botón **“⬇️ Instalar aplicación”** de la barra superior,
  o el ícono de instalar que aparece al final de la barra de direcciones.
- **Android (Chrome):** menú **⋮** → **“Instalar aplicación”** / **“Agregar a pantalla de inicio”**.
- **iPhone / iPad (Safari):** botón **Compartir** → **“Agregar a inicio”**.
  *(En iOS el botón automático no aparece; se agrega manualmente.)*

Una vez instalada, se abre en su **propia ventana** (modo standalone), con su ícono y nombre **Bot Ventas**.

---

## ☁️ Publicar en Vercel (opcional)
El proyecto ya incluye `vercel.json` para que las rutas funcionen al refrescar.
1. Sube el proyecto a un repositorio (GitHub) **o** usa la opción de subir carpeta en Vercel.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el proyecto.
3. Vercel detecta **Vite** automáticamente (build: `npm run build`, salida: `dist`). Pulsa **Deploy**.
4. Listo: obtienes un enlace público que abre en cualquier dispositivo y permite instalar la PWA.
