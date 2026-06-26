# 🎤 Guía de demostración — RA3

Guion para mostrar **IA InkaShop (Versión Beta RA3)**. Enfocado en lo que pide el RA3:
**CRUD completo, persistencia, API REST, IA / servicio externo, manejo de errores y pruebas.**

> **Antes de empezar:** `npm run dev` → `http://localhost:5173`. Para una demo limpia en modo local,
> borra el Local Storage (F12 → Application → Local Storage → Clear) y recarga.
> Para la **API REST** y la **PWA instalable**, usa el despliegue de Vercel (o `npx vercel dev` +
> `npm run preview`).

---

## 1. Introducción y modos (1 min)
- **IA InkaShop**: asistente inteligente de ventas, con comprador y vendedor.
- Explica los **dos modos de persistencia**: **local** (`localStorage`, sin claves) y **Supabase**
  (real, con `VITE_USAR_SUPABASE=true`). Y los **dos modos de IA**: **simulada** (`ChatBotIA`) y
  **real con DeepSeek** (`VITE_USAR_IA_REAL=true`). El **pago es simulado**.

## 2. CRUD del vendedor (2 min) — **núcleo del RA3**
- Entra como `vendedor@demo.com` / `123456` (modo local) o tu cuenta vendedor (Supabase).
- En el **Panel del vendedor** / desde el **chat de gestión**: **crea** un producto (muestra una
  **validación**: precio 0 o nombre vacío), **lista**, **edita**, **actualiza stock** y **elimina**
  (aparece la **confirmación** antes de borrar). Señala los mensajes de éxito/error (toasts).

## 3. Comprador: catálogo, carrito y pedido (2 min)
- Entra como `comprador@demo.com` / `123456`.
- **Catálogo**: busca/filtra. **Asistente**: pide “laptop hasta 2000” (filtra por precio; cada
  consulta entra a la **Pila LIFO**).
- **Carrito**: agrega, cambia cantidades, intenta superar el **stock** (se bloquea → validación).
- **Pagar** (simulado): no deja pagar con carrito vacío y **revalida el stock** antes de confirmar.
- **Pedidos**: aparece el pedido; el vendedor lo atiende con la **Cola FIFO** (“Atender siguiente”).

## 4. Mensajería comprador ↔ vendedor (1 min)
- Comprador envía una consulta (no permite mensaje vacío). Vendedor la ve como **“nuevo”** y
  responde; el comprador ve la respuesta marcada como **leída**.

## 5. Persistencia real con Supabase (1 min)
- Con `VITE_USAR_SUPABASE=true`, muestra que los datos viven en **PostgreSQL (Supabase)** con
  **RLS**: registro/login reales y catálogo/pedidos/mensajes compartidos. El modo local sigue
  siendo el **fallback** si no hay claves.

## 6. API REST propia (2 min) — **clave para el RA3**
- Abre **Postman / Thunder Client** (ver [`API-REST-RA3.md`](API-REST-RA3.md)):
  - `GET /api/productos` → lista en JSON.
  - `POST /api/productos` → crea (muestra un **400** enviando precio 0).
  - `PUT /api/producto?id=1` → actualiza; `DELETE /api/producto?id=1` → elimina (**404** si no existe).
  - `GET /api/pedidos`, `POST /api/pedidos`, `PUT /api/pedido?id=` (estado).
  - `GET/POST /api/mensajes`. `POST /api/chat` (IA).
- Recalca: respuestas **JSON**, validación de **método** (405) y **códigos** 200/201/400/404/500.

## 7. IA real opcional + manejo de errores (1 min)
- Con `VITE_USAR_IA_REAL=true`, el asistente llama a **`/api/chat`** (DeepSeek). Si la API **falla**,
  la app **cae automáticamente a la IA simulada** (muestra el aviso amable). La clave vive solo en
  el servidor.

## 8. Pruebas (1 min)
- Ejecuta **`npm run test`**: las pruebas verifican **Cola FIFO**, **Pila LIFO**, **carrito**
  (subtotal/descuento/total), **validaciones y CRUD de productos**, **registro de pedido**,
  **ChatBotIA** y el **fallback de la IA real**.
- Ejecuta **`npm run build`** para mostrar que compila sin errores.

---

## ❓ Posibles preguntas
- **¿Cómo cumple el CRUD?** → Vendedor (UI) + **API REST** (`api/`), sobre productos/pedidos/mensajes.
- **¿Hay persistencia real?** → Sí, **Supabase** (opcional); con `localStorage` como respaldo.
- **¿Hay backend / servicio externo?** → **Vercel Serverless Functions** (API REST) y **DeepSeek** (IA real).
- **¿Por qué Cola y Pila?** → FIFO para atender pedidos en orden (`ColaPedidos.ts`); LIFO para mostrar
  primero la consulta más reciente (`PilaConsultas.ts`).
- **¿El pago es real?** → No, **simulado** (no se cobra nada).
- **¿Dónde están las claves?** → Solo en el servidor (variables de entorno), nunca en el frontend.
