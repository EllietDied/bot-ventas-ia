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

## 4. Asistente IA de Ventas — pantalla principal (2.5 min) — **lo más importante**

- Al iniciar sesión, lo primero que aparece es el **Asistente IA** (el chatbot es el centro de la app).
- Usa los **botones rápidos**: “Recomiéndame una laptop”, “Busco algo económico”, “Armar una PC básica”, “Ver productos gamer”.
- Escribe una consulta con presupuesto, por ejemplo **“laptop hasta 2000”**, y muestra que el asistente **filtra por precio**.
- Señala que las recomendaciones aparecen como **tarjetas dentro del chat**, con acciones: *ver detalle, agregar, comparar y consultar al vendedor*.
- Pulsa **Comparar** en dos productos para mostrar la **tabla comparativa** dentro del chat.
- Explica que cada consulta entra a la **Pila LIFO** (“Consultas recientes”) y alimenta las recomendaciones (`recomendarPorConsulta`).

## 5. Explorar catálogo (0.5 min)

- Muestra la sección secundaria **“Explorar catálogo”** con buscador y filtro, para quien prefiera buscar por su cuenta.
- Explica el algoritmo `ConsultarProducto` (`CatalogoService.ts`).

## 6. Carrito, cálculo y pago simulado (1.5 min)

- Agrega productos al **carrito** e intenta superar el **stock** (el botón "+" se bloquea → validación).
- Muestra el **cálculo de subtotal, descuento y total** (explica la regla de descuento).
- Ve a **pagar**, elige un método y confirma. Recalca que el **pago es simulado**.
- Al confirmar, el **asistente guía el cierre**: “Validé el stock”, “Calculé tu subtotal, descuento y total” y “Tu pedido fue registrado correctamente”.

## 7. Pedidos + Cola FIFO (1 min)

- En **Pedidos**, muestra el pedido recién creado en estado **"pendiente"**.
- Explica la **Cola FIFO** de pedidos pendientes y pulsa **"Atender siguiente"** (el estado pasa a "atendido").

## 8. Panel del vendedor (1 min)

- Cierra sesión e ingresa como `vendedor@demo.com` / `123456`.
- Muestra el bloque **“Sugerencias del asistente IA”** (bajo stock, más consultados, mensajes y pedidos pendientes).
- **Publica un producto** (muestra una validación: precio 0 o campos vacíos).
- **Actualiza el stock** de un producto y verifica el cambio en el catálogo.

## 9. Mensajería comprador ↔ vendedor (1.5 min) — **RF10**

- Como **comprador**, abre **Mensajes**, elige un producto y envía una consulta al vendedor
  (muestra la **validación** dejando el mensaje vacío).
- Cierra sesión, entra como **vendedor**, abre **Mensajes**: verás la consulta con el aviso **"nuevo"**; respóndela.
- Vuelve a entrar como **comprador** y muestra que la respuesta llegó y quedó marcada como **leída**.
- Explica que las conversaciones se guardan en una lista **`Mensaje[]`** (con remitente, destinatario,
  producto relacionado, fecha y estado leído/no leído).

## 10. Estructuras de datos y pruebas (1 min) — **clave para el RA2**

- Recuerda dónde se ven las estructuras del RA1: la **Cola FIFO** en **Pedidos** (“Atender siguiente”),
  la **Pila LIFO** en el **Asistente** (“Consultas recientes”) y los **cálculos** (subtotal/descuento/total) en el **Carrito**.
- En el editor, muestra el código de `src/core/estructuras/ColaPedidos.ts` y `PilaConsultas.ts`.
- Ejecuta **`npm run test`**: **34 pruebas automatizadas** verifican las estructuras y los cálculos.

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
