# 🎤 Guía de demostración — RA2

Guion paso a paso para sustentar el **Bot de Ventas Multiplataforma basado en IA**.
Tiempo estimado: **10 – 12 minutos**.

> **Antes de empezar:** ejecuta `npm run dev`, abre `http://localhost:5173` y, para una demo limpia,
> borra el Local Storage (F12 → Application → Local Storage → Clear) y recarga.
>
> **Para mostrar la instalación de la PWA**, usa el enlace de Vercel o `npm run build` + `npm run preview`
> (el botón “Instalar aplicación” no aparece con `npm run dev`).

---

## 1. Introducción (1 min)

- Presenta el proyecto: "Bot de Ventas Multiplataforma basado en IA", del curso Taller de Aplicaciones.
- Menciona que es la **implementación del RA1**: arquitectura por capas, clases del UML y estructuras de datos.
- Aclara que la **IA y los pagos son simulados** y que la app funciona **sin backend** (datos en `localStorage`).
- Señala que es una **PWA instalable** y responsive (PC y celular); Telegram/WhatsApp son integraciones **futuras**, y **no** es una app nativa.

## 2. Arquitectura del proyecto (1 min)

- Muestra la estructura de carpetas (`src/core`, `src/contexto`, `src/paginas`).
- Explica las **3 capas**: presentación (React), lógica de negocio (contextos y servicios), datos (`core/datos`).
- Señala que las **clases del UML** están en `src/core/modelos`.

## 3. Registro e inicio de sesión (1 min)

- Crea una cuenta nueva en **Registro** y muestra una **validación** (deja un campo vacío o usa un correo inválido).
- Inicia sesión con `comprador@demo.com` / `123456`.
- Explica el algoritmo `IniciarSesion` (`AuthService.ts`) y las **rutas protegidas**.

## 4. Catálogo, buscador y recomendaciones (1.5 min)

- Recorre el **catálogo** y usa el **buscador** y el **filtro por categoría**.
- Explica el algoritmo `ConsultarProducto` (`CatalogoService.ts`).
- Señala la sección **"Recomendado para ti"** y explica que usa las **categorías consultadas** (`recomendarProducto`).

## 5. Chatbot simulado + Pila LIFO (1.5 min)

- Entra al **Chatbot** y escribe consultas: "hola", "¿precio del Teclado Mecánico?", "¿qué categorías tienen?".
- Explica que `responderConsulta` usa **reglas por palabras clave** (IA simulada).
- Muestra el panel **"Consultas recientes"** y explica que es una **Pila LIFO** (la última consulta aparece primero).

## 6. Carrito, cálculo y pago simulado (1.5 min)

- Agrega productos al **carrito** e intenta superar el **stock** (el botón "+" se bloquea → validación).
- Muestra el **cálculo de subtotal, descuento y total** (explica la regla de descuento).
- Ve a **pagar**, elige un método y confirma. Recalca que el **pago es simulado**.

## 7. Pedidos + Cola FIFO (1 min)

- En **Pedidos**, muestra el pedido recién creado en estado **"pendiente"**.
- Explica la **Cola FIFO** de pedidos pendientes y pulsa **"Atender siguiente"** (el estado pasa a "atendido").

## 8. Panel del vendedor (1 min)

- Cierra sesión e ingresa como `vendedor@demo.com` / `123456`.
- **Publica un producto** (muestra una validación: precio 0 o campos vacíos).
- **Actualiza el stock** de un producto y verifica el cambio en el catálogo.

## 9. Mensajería comprador ↔ vendedor (1.5 min) — **RF10**

- Como **comprador**, abre **Mensajes**, elige un producto y envía una consulta al vendedor
  (muestra la **validación** dejando el mensaje vacío).
- Cierra sesión, entra como **vendedor**, abre **Mensajes**: verás la consulta con el aviso **"nuevo"**; respóndela.
- Vuelve a entrar como **comprador** y muestra que la respuesta llegó y quedó marcada como **leída**.
- Explica que las conversaciones se guardan en una lista **`Mensaje[]`** (con remitente, destinatario,
  producto relacionado, fecha y estado leído/no leído).

## 10. Evidencia académica (1 min) — **clave para el RA2**

- Abre la pantalla **Evidencia académica** (`/evidencia`).
- Muestra las **Listas** (productos, usuarios, pedidos y **mensajes**), la **Cola FIFO**, la **Pila LIFO** y el **cálculo** de totales.
- Aquí se ven, en un solo lugar, todas las estructuras de datos del RA1 funcionando con datos reales de la demo.

## 11. Cierre (30 s)

- Resume cómo el código **mapea con el RA1** (clases, estructuras y algoritmos).
- Menciona las **mejoras futuras**: IA real, base de datos, más canales (WhatsApp/Telegram) y pagos reales.

---

## ❓ Posibles preguntas del jurado

- **¿Dónde está la herencia del UML?** → `Persona → Usuario → Comprador/Vendedor` en `src/core/modelos`.
- **¿Por qué una Cola para los pedidos?** → Para atender en orden de llegada (FIFO); está en `ColaPedidos.ts`.
- **¿Por qué una Pila para las consultas?** → Para mostrar primero la más reciente (LIFO); está en `PilaConsultas.ts`.
- **¿Cómo persisten los datos sin backend?** → Con `localStorage` (`core/datos/almacenamiento.ts`).
- **¿La IA es real?** → No, está simulada por reglas; la clase `ChatBotIA` está lista para conectar una IA real más adelante.
- **¿La mensajería usa servidor?** → No: se guarda en `localStorage` con una lista `Mensaje[]`; es simulada, sin backend ni tiempo real (RF10).
