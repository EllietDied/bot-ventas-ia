1. Bot de Ventas Multiplataforma basado en IA (demo académica)

Aplicación web desarrollada en **React + TypeScript (Vite)** para el curso **Taller de Aplicaciones**
(Universidad Señor de Sipán – Ciclo IV). Implementa el diseño del **RA1**: arquitectura por capas,
clases del UML y estructuras de datos (Lista, Cola **FIFO** y Pila **LIFO**). Es una **PWA instalable** y **responsive** (PC y celular).

> La **inteligencia artificial** del chatbot y los **pagos** están **simulados** (no usan servicios
> externos). Todo funciona **sin backend**, guardando los datos en `localStorage`.

**Autores:** Beryher Agip · Andherson Mendoza · Fabricio Salazar

---

2. Instalación y ejecución

Requisitos: tener **Node.js 18+** instalado.

```bash
npm install      # instala las dependencias (solo la primera vez)
npm run dev      # inicia la app en modo desarrollo
```

Abre la dirección que muestra la consola (normalmente **http://localhost:5173**).

Otros comandos:

```bash
npm run build    # compila y verifica TypeScript (genera la carpeta dist/)
npm run preview  # sirve la versión compilada
npm run test     # ejecuta las pruebas automatizadas (Vitest)
```

3. Cuentas de prueba

| Rol       | Correo               | Contraseña |
|-----------|----------------------|------------|
| Comprador | comprador@demo.com   | 123456     |
| Vendedor  | vendedor@demo.com    | 123456     |

> Para reiniciar los datos: F12 → **Application** → **Local Storage** → **Clear**.

---

4. PWA y multiplataforma

- **Actualmente es una PWA (Progressive Web App) responsive e instalable** en PC y celular: se puede
  agregar a la pantalla de inicio y abrir en su propia ventana (modo *standalone*), como una app.
- **Telegram, WhatsApp y otras plataformas son integraciones futuras** (contempladas en el RA1 como
  mejoras), **no** implementadas en esta versión.
- **No es una aplicación móvil nativa** (no es un APK ni una app de tienda): es una aplicación web
  instalable que funciona en cualquier dispositivo con navegador.

Cómo instalarla: ver [COMO-EJECUTAR.md](COMO-EJECUTAR.md).

---

5. Arquitectura por capas

El proyecto respeta la **arquitectura de 3 capas** del RA1:

| Capa del RA1            | Carpeta                              | Responsabilidad                          |
|-------------------------|--------------------------------------|------------------------------------------|
| Presentación (UI)       | `src/paginas`, `src/componentes`     | Pantallas y componentes de React         |
| Lógica de negocio       | `src/contexto`, `src/core/servicios` | Estado global y algoritmos               |
| Datos (persistencia)    | `src/core/datos`                     | `localStorage` y datos de ejemplo        |
| Modelo + estructuras    | `src/core/modelos`, `src/core/estructuras` | Clases del UML, Cola y Pila        |

```
src/
├─ core/                  ← CAPA CORE (modelo + lógica + datos)
│  ├─ modelos/            Clases del UML (Usuario, Producto, Pedido, Carrito, ChatBotIA...)
│  ├─ estructuras/        ColaPedidos (FIFO) y PilaConsultas (LIFO)
│  ├─ servicios/          Algoritmos (login, búsqueda)
│  └─ datos/              localStorage y datos de ejemplo (seed)
├─ contexto/              Estado global con React Context
├─ componentes/           UI reutilizable (navbar, tarjeta, ruta protegida)
└─ paginas/               Pantallas (login, catálogo, carrito, chat, evidencia...)
```

---

6. Clases del UML → `src/core/modelos`

Herencia: **Persona → Usuario → Comprador / Vendedor** (en TypeScript con `extends`).

| Clase           | Tipo       | Descripción                                              |
|-----------------|------------|---------------------------------------------------------|
| `Persona`       | interface  | Datos personales base (nombre, dni, teléfono...)        |
| `Usuario`       | interface  | Hereda de Persona; añade correo, contraseña, rol        |
| `Comprador`     | interface  | Hereda de Usuario (rol comprador)                       |
| `Vendedor`      | interface  | Hereda de Usuario (rol vendedor)                        |
| `Producto`      | interface  | Artículo del catálogo (precio, stock, categoría)        |
| `Pedido`        | interface  | Pedido con detalles, totales y estado                   |
| `DetallePedido` | interface  | Línea de un pedido (producto, cantidad, subtotal)       |
| `Pago`          | interface  | Pago simulado de un pedido                              |
| `Mensaje`       | interface  | Mensaje entre usuarios (comprador ↔ vendedor) — **RF10**  |
| `MensajeBot`    | interface  | Mensaje del chat con el bot (IA simulada)               |
| `Carrito`       | **clase**  | Lógica del carrito y cálculo de subtotal/descuento/total |
| `ChatBotIA`     | **clase**  | IA simulada: responde consultas y recomienda productos  |

---

7. Estructuras de datos

| Estructura      | Implementación                          | Uso en el sistema                         |
|-----------------|-----------------------------------------|-------------------------------------------|
| **Lista**       | arreglos `Producto[]`, `Usuario[]`, `Pedido[]`, `Mensaje[]` | Almacenar las colecciones del sistema |
| **Cola (FIFO)** | `ColaPedidos` (`src/core/estructuras`)  | Pedidos pendientes: primero en llegar, primero en atender |
| **Pila (LIFO)** | `PilaConsultas` (`src/core/estructuras`)| Consultas recientes: la última se muestra primero |

Todo esto se visualiza en la pantalla **Evidencia académica** (`/evidencia`).

---

8. Algoritmos del RA1 → código

| Algoritmo (RA1)            | Dónde está                                   |
|----------------------------|----------------------------------------------|
| `IniciarSesion`            | `core/servicios/AuthService.ts` → `iniciarSesion` |
| `ConsultarProducto`        | `core/servicios/CatalogoService.ts` → `buscarProductos` |
| `RecomendarProducto`       | `core/modelos/ChatBotIA.ts` → `recomendarProducto` |
| `RegistrarPedido` / `ProcesarPago` | `contexto/PedidosContext.tsx` → `registrarPedido` |
| `ResponderConsultaChatBot` | `core/modelos/ChatBotIA.ts` → `responderConsulta` |

---

9. Funcionalidades

- Registro e inicio de sesión con selección de rol (comprador / vendedor).
- Catálogo de productos tecnológicos con buscador y filtro por categoría.
- Chatbot con respuestas simuladas (por palabras clave).
- Recomendación de productos según las categorías consultadas.
- Carrito de compras con cálculo de **subtotal, descuento y total** (respeta el stock).
- Registro simulado de pedidos y pagos.
- Panel del vendedor: publicar productos y actualizar stock (con validaciones).
- **Mensajería** entre comprador y vendedor sobre un producto, con estado leído/no leído (**RF10**).
- Historial de pedidos y de consultas.
- Pantalla **Evidencia académica** con las listas, la cola FIFO y la pila LIFO.
- Formularios con validaciones y mensajes de error.

10. Validaciones incluidas

- **Campos vacíos:** login, registro y publicación de productos.
- **Correo:** formato válido en el registro; no se permite correo duplicado.
- **Contraseña:** mínimo 6 caracteres y confirmación que coincida.
- **Stock y cantidades:** no se puede agregar al carrito más de lo disponible; el pago revalida el stock.
- **Precio / stock del vendedor:** precio mayor a 0 y stock no negativo.
- **Roles:** el comprador no entra al panel del vendedor y viceversa (rutas protegidas).
- **Carrito vacío:** no se puede ir al pago sin productos.
- **Mensajes:** no se permiten mensajes ni respuestas vacíos.

11. Pruebas automatizadas (Vitest)
El proyecto incluye **34 pruebas** que verifican la lógica del `core` (sin tocar la interfaz):
- **Cola FIFO** (`ColaPedidos`) y **Pila LIFO** (`PilaConsultas`).
- **Cálculos del carrito**: subtotal, descuento (5% / 10%) y total.
- **Validaciones** de inicio de sesión y registro.
- **Búsqueda** de productos y **recomendación** del chatbot.

Se ejecutan con `npm run test`.

---

12. Flujo de la aplicación

1. El usuario **inicia sesión** o se **registra** eligiendo su rol.
2. **Comprador:** explora el **catálogo**, consulta el **chatbot**, agrega productos al **carrito**,
   realiza el **pago simulado**, **envía consultas al vendedor** (Mensajes) y revisa su **historial de pedidos**.
3. **Vendedor:** entra a su **panel**, **publica productos**, **actualiza el stock** y **responde los mensajes** de los compradores.
4. Cada pedido entra a la **cola FIFO** de pendientes; con **"Atender siguiente"** se procesa el más antiguo.
5. Cada búsqueda o consulta al bot entra a la **pila LIFO** de consultas recientes, que alimenta las **recomendaciones**.
6. La pantalla **Evidencia académica** muestra todo lo anterior de forma visible.

---

13. Tecnologías

- React 18 + TypeScript (modo estricto)
- Vite (entorno de desarrollo y build)
- React Router (navegación entre pantallas)
- React Context (estado global)
- localStorage (persistencia local, sin backend)
- PWA: *manifest* + *service worker* (instalable y con caché de los archivos principales)

---

14. Documentación de la demo

En la raíz: **[`COMO-EJECUTAR.md`](COMO-EJECUTAR.md)** — guía rápida de instalación, ejecución y cómo instalar la PWA.

En la carpeta [`docs/`](docs) encontrarás:

- **`guia-demostracion-RA2.md`** — guion paso a paso para sustentar el proyecto.
- **`capturas.md`** — lista de capturas de pantalla que conviene tomar.

---

15. Despliegue: subir a GitHub y publicar en Vercel

> Requisito: tener **Git** instalado ([git-scm.com](https://git-scm.com)) y una cuenta en GitHub y en Vercel (ambas gratis).

# 1. Subir el proyecto a GitHub
Crea un repositorio **vacío** en [github.com](https://github.com) (por ejemplo `bot-ventas-ia`). Luego,
desde la carpeta del proyecto, en la terminal:

```bash
git init
git add .
git commit -m "Bot de Ventas IA - PWA"
git branch -M main
git remote add origin https://github.com/USUARIO/bot-ventas-ia.git
git push -u origin main
```

> Reemplaza `USUARIO` por tu usuario de GitHub. El `.gitignore` ya evita subir `node_modules`, `dist`
> y archivos locales, así que el repositorio queda limpio.

# 2. Conectar con Vercel
1. Entra a [vercel.com](https://vercel.com) e inicia sesión **con tu cuenta de GitHub**.
2. **Add New → Project** e **importa** el repositorio `bot-ventas-ia`.
3. Vercel detecta **Vite** automáticamente:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - *No se necesitan variables de entorno.*
4. Pulsa **Deploy**. En ~1 minuto tendrás una **URL pública** (`https://...vercel.app`).
5. Cada `git push` a `main` vuelve a desplegar **automáticamente**.

> El archivo `vercel.json` ya está incluido para que las rutas (`/carrito`, `/chat`, `/evidencia`…)
> funcionen correctamente al refrescar la página.

---

16. Pruebas después de publicar

Con la URL de Vercel en línea, verifica:

1. **Carga:** la página abre y muestra el inicio de sesión.
2. **Login:** entra con `comprador@demo.com` / `123456`.
3. **Rutas al refrescar:** entra a `/evidencia` y presiona **F5** → debe cargar (no “404”).
4. **Flujos principales:** catálogo y buscador, chatbot, carrito + pago simulado, pedidos (cola FIFO),
   mensajes (comprador↔vendedor) y Evidencia académica.
5. **PWA instalable:** aparece el botón **“Instalar aplicación”** (o el ícono en la barra de
   direcciones); instálala en la PC y compruébala en su propia ventana.
6. **Móvil:** abre la URL en un celular → diseño responsive; en Android instálala desde el menú del navegador.
7. **Offline:** tras abrirla una vez, prueba sin conexión → debe seguir abriendo (gracias al service worker).
8. **Datos por dispositivo:** cada navegador parte con los datos de ejemplo (su propio `localStorage`).
