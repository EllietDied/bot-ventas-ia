# IA InkaShop — Versión Beta RA3

**Proyecto RA3 – Taller de Programación de Aplicaciones (USS).**

IA InkaShop es una tienda con **asistente inteligente de ventas**. Tiene dos perfiles
(comprador y vendedor), catálogo, carrito, pedidos y mensajería comprador↔vendedor. Es
una **PWA instalable** con **modo claro/oscuro**.

Esta versión **RA3** cumple, de forma demostrable: **CRUD completo**, **persistencia de datos**,
**integración con una API REST propia**, **uso de IA / servicio externo**, **manejo de errores**
y **pruebas automatizadas**.

> **Modos de funcionamiento.** La app puede funcionar en **modo local** con `localStorage`
> (respaldo académico, sin claves) **o** activar **persistencia real con Supabase**. La IA
> tiene un **modo simulado** (reglas locales) y un **modo real opcional con DeepSeek** a través
> de una función serverless. Además incorpora una **API REST** propia (Vercel Serverless
> Functions). El **pago es siempre simulado** (no se cobra nada real).

---

## Tecnologías

- **Frontend:** React 18 + TypeScript + Vite 5, React Router 6, React Context.
- **Persistencia:** `localStorage` (modo local) **o** **Supabase** (PostgreSQL + Auth + RLS), opcional.
- **Backend ligero / API REST:** **Vercel Serverless Functions** (`api/*.ts`).
- **IA:** **ChatBotIA** (simulada, reglas locales) **o** **DeepSeek** (real, opcional, vía `api/chat.ts`).
- **PWA:** manifest + service worker. **Pruebas:** Vitest.
- **Estructuras de datos:** **Cola FIFO** (`ColaPedidos`, atención de pedidos) y **Pila LIFO**
  (`PilaConsultas`, últimas consultas del asistente).

---

## Cómo ejecutar

```bash
npm install        # instalar dependencias
npm run dev        # desarrollo (frontend) en http://localhost:5173
npm run build      # compila TypeScript + build de producción (dist/)
npm run preview    # sirve el build de producción (prueba la PWA)
npm run test       # pruebas con Vitest
```

> La carpeta `api/` (API REST) corre en Vercel. En local usa `npx vercel dev` para
> levantar las funciones serverless (con `npm run dev` solo corre el frontend).

---

## Variables de entorno

Copia `.env.example` a `.env.local` (ignorado por git) y completa lo que necesites.
**Sin variables, la app funciona en modo local + IA simulada.**

```bash
# Asistente IA
VITE_USAR_IA_REAL=false      # true = DeepSeek vía /api/chat ; false = IA simulada (fallback)
DEEPSEEK_API_KEY=            # SOLO servidor (api/chat.ts). Nunca con prefijo VITE_.

# Persistencia
VITE_USAR_SUPABASE=false     # true = Supabase ; false = localStorage
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=      # pública (la protege RLS)

# API REST (servidor). Si se omiten, reutiliza las VITE_SUPABASE_* de arriba.
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # SECRETA: habilita CRUD completo (POST/PUT/DELETE). Solo servidor.
```

Las claves secretas (`DEEPSEEK_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) viven **solo en el
servidor** (variables de entorno de Vercel o `.env.local`), **nunca** en el frontend ni en
`localStorage`. `.env.local` está en `.gitignore` y **no se sube**.

---

## Persistencia: modo local vs. Supabase

| | Modo local (por defecto) | Modo Supabase |
|---|---|---|
| Activación | `VITE_USAR_SUPABASE=false` (o sin configurar) | `VITE_USAR_SUPABASE=true` + URL + anon key |
| Dónde viven los datos | `localStorage` del navegador | PostgreSQL en la nube (con RLS) |
| Cuentas | demo locales (ver abajo) | registro real con Supabase Auth |

El cambio es **transparente**: cada contexto/servicio decide según el interruptor
(`usarSupabase()`), y el modo local sigue siendo el **fallback**. Entidades con CRUD real en
Supabase: **productos, pedidos, mensajes, consultas del asistente y perfiles/usuarios**
(servicios en `src/core/servicios/*Service.ts`). El SQL del esquema está en `supabase/schema.sql`
(+ `seed.sql` y `hardening.sql`).

---

## IA: simulada vs. DeepSeek

- **IA simulada (fallback obligatorio):** clase `ChatBotIA` (`src/core/modelos/ChatBotIA.ts`).
  Reglas locales, sin internet ni clave.
- **IA real (opcional):** con `VITE_USAR_IA_REAL=true`, el frontend llama a **`/api/chat`**, que
  consulta **DeepSeek** con la clave del servidor. Solo se envía lo necesario (catálogo relevante,
  historial breve); **nunca** contraseñas ni datos de pago. Si DeepSeek falla, la app **cae
  automáticamente** a la IA simulada.

---

## API REST

API propia en `api/` (Vercel Serverless Functions), en JSON, con validación de método y manejo
de errores (`200/201/400/404/405/500`):

| Recurso | Endpoints |
|---|---|
| Productos | `GET /api/productos`, `POST /api/productos`, `GET·PUT·DELETE /api/producto?id=` |
| Pedidos | `GET /api/pedidos`, `POST /api/pedidos`, `GET·PUT·DELETE /api/pedido?id=` |
| Mensajes | `GET /api/mensajes`, `POST /api/mensajes` |
| Asistente | `POST /api/chat` |

Ejemplos completos (body, respuestas y errores) para **Postman / Thunder Client** en
[`docs/API-REST-RA3.md`](docs/API-REST-RA3.md).

---

## Cuentas demo (modo local)

| Rol | Correo | Contraseña |
|---|---|---|
| Comprador | `comprador@demo.com` | `123456` |
| Vendedor | `vendedor@demo.com` | `123456` |

> En **modo Supabase** estas cuentas no existen: se usan las que se registren realmente.
> El catálogo inicial (15 productos) está en `src/core/datos/seed.ts`.

---

## Pruebas

```bash
npm run test
```

Cubren la lógica principal: **Cola FIFO** (`ColaPedidos`), **Pila LIFO** (`PilaConsultas`),
**carrito** (subtotal/descuento/total), **validaciones de productos**, **CRUD de productos en
modo local**, **registro de pedido**, **ChatBotIA simulada** y el **fallback** cuando la IA real
no responde, además de autenticación, búsqueda del catálogo y validación de documentos por país.

---

## Despliegue (Vercel + PWA)

- `vercel.json` reescribe las rutas del SPA pero **excluye `/api`** (la API REST funciona).
- Las rutas internas (`/catalogo`, `/carrito`, `/pedidos`, `/mensajes`, `/vendedor`) funcionan al
  refrescar.
- El **service worker** cachea **solo los archivos de la app** (mismo origen); las llamadas a la
  API/Supabase van siempre a la red (datos siempre frescos).

---

## Estructura del proyecto (resumen)

```
api/                 API REST (Serverless Functions): productos, producto, pedidos, pedido, mensajes, chat, vision
src/
  core/
    modelos/         Clases del dominio (Producto, Pedido, Carrito, ChatBotIA, ...)
    estructuras/     ColaPedidos (FIFO), PilaConsultas (LIFO)
    servicios/       Lógica + capa Supabase + CRUD local puro (ProductosLocal, PedidosLocal)
    datos/           localStorage, cliente Supabase, seed
  contexto/          Estado global (Sesión, Productos, Pedidos, Carrito, Mensajería, Consultas)
  paginas/           Vistas (Asistente, Catálogo, Carrito, Checkout, Pedidos, Mensajes, PanelVendedor, ...)
  componentes/       UI reutilizable
supabase/            schema.sql, seed.sql, hardening.sql
docs/                API-REST-RA3.md, guía de demostración
```
