# Manual de Uso — IA InkaShop

> Guía para usar la aplicación como **comprador**, **vendedor** o **visitante**.
> IA InkaShop es una tienda en línea con un asistente de ventas por Inteligencia
> Artificial, búsqueda de productos por foto, pagos y envíos.

---

## Índice
1. [Roles de usuario](#1-roles-de-usuario)
2. [Registro e inicio de sesión](#2-registro-e-inicio-de-sesión)
3. [Guía del comprador](#3-guía-del-comprador)
4. [Guía del vendedor](#4-guía-del-vendedor)
5. [Las funciones de Inteligencia Artificial](#5-las-funciones-de-inteligencia-artificial)
6. [Instalar la app en el celular (PWA)](#6-instalar-la-app-en-el-celular-pwa)
7. [Preguntas frecuentes](#7-preguntas-frecuentes)

---

## 1. Roles de usuario

| Rol | Qué puede hacer |
|---|---|
| **Visitante** | Explorar el catálogo público (sin comprar). |
| **Comprador** | Chatear con la IA, buscar por foto, carrito, pagar, envíos, billetera, pedidos y mensajes. |
| **Vendedor** | Publicar y gestionar productos, ver estadísticas y responder consultas. |

---

## 2. Registro e inicio de sesión

1. Pulsa **Iniciar sesión** (arriba a la derecha) → **Crear cuenta**.
2. Elige tu **rol** (comprador o vendedor) y completa tus datos (nombre, documento,
   teléfono, dirección, correo y contraseña).
3. Confirma. La cuenta queda creada y con la sesión iniciada.
4. Para entrar después, usa tu **correo** y **contraseña**.

> Un **visitante** puede mirar el catálogo sin cuenta, pero para comprar necesita registrarse.

---

## 3. Guía del comprador

### 3.1. Asistente IA (pantalla de inicio)
- Escribe lo que buscas en lenguaje natural: por **categoría**, **uso** o **presupuesto**
  (ej. *"una laptop para diseño hasta 3000 soles"*).
- La IA te recomienda productos del catálogo y puedes **ver detalle**, **comparar**,
  **agregar al carrito** o **consultar al vendedor** desde el mismo chat.
- Los **botones rápidos** ("Quiero algo gamer", "Ver ofertas"…) hacen consultas comunes.

### 3.2. Buscar por foto
Tres formas de hacerlo:
1. **Botón "Buscar por foto"** → elegir una foto de la galería o tomar una con la cámara.
2. **Pegar una imagen** (`Ctrl+V`) directamente en el chat: la foto queda **adjunta**;
   puedes escribir una **descripción opcional** (ej. *"memoria RAM DDR5"*) para acertar
   más, y pulsas **Enter** para buscar.
- La IA identifica el producto de la foto y te recomienda opciones del catálogo.

> 💡 La **primera** búsqueda por foto tras un rato puede tardar unos segundos
> (el modelo de visión "despierta"); la siguiente es rápida.

### 3.3. Explorar catálogo
- Usa el **buscador** o los **filtros por categoría**.
- Haz **clic en cualquier producto** para abrir su **página de detalle**: galería de
  fotos, marca, modelo, material, descripción, características, precio y stock.

### 3.4. Carrito y pago (checkout)
1. Agrega productos al **carrito**.
2. En el **checkout**, primero eliges la **dirección de envío** (ver 3.5) y la **empresa**
   (**Shalom** u **Olva**).
3. Eliges el **método de pago**: billetera (saldo), tarjeta, Yape o PagoEfectivo.
4. Confirmas. Recibes el pedido registrado y puedes seguirlo en **Pedidos**.

### 3.5. Libreta de direcciones
- Puedes guardar **hasta 3 direcciones** de envío.
- Cada dirección incluye: receptor, DNI, teléfono, correo, dirección, departamento,
  provincia, distrito y una referencia.
- Eliges cuál usar en cada compra, o agregas una nueva.

### 3.6. Billetera
- Recarga **saldo** (con Culqi) para pagar tus compras de forma rápida.
- Puedes ver tu saldo actual y actualizarlo.

### 3.7. Pedidos y mensajes
- **Pedidos**: historial de tus compras, con su estado y datos de envío.
- **Mensajes**: conversa con el vendedor para resolver dudas de un producto.

---

## 4. Guía del vendedor

### 4.1. Panel del vendedor
- **Publicar un producto**: completa nombre, **marca**, **modelo**, **material**,
  **categoría** (se elige de una lista fija), descripción, **características** (una por
  línea), precio, stock y **varias fotos** (hasta 6; la primera es la principal).
- **Gestionar**: actualiza el stock, edita o elimina tus productos.
- **Sugerencias del asistente**: te muestra productos con bajo stock, los más
  consultados y los mensajes/pedidos pendientes.

### 4.2. Asistente de gestión (chat del vendedor)
- Un chat que te ayuda a **agregar, modificar o eliminar** productos por pasos guiados,
  y responde dudas sobre tu catálogo.

### 4.3. Estadísticas
- Consulta métricas de tu tienda: productos más consultados, categorías, etc.

### 4.4. Mensajes
- Responde las consultas que te envían los compradores sobre tus productos.

---

## 5. Las funciones de Inteligencia Artificial

| Función | Qué hace | Tecnología |
|---|---|---|
| **Asistente de ventas** | Conversa y recomienda productos del catálogo | DeepSeek |
| **Búsqueda por foto** | "Ve" la foto e identifica el producto | Gemma (visión) + MobileNet (respaldo) |
| **Recomendación personalizada** | Aprende de tus compras y búsquedas para responder a tu medida | Perfil derivado de tus datos |

> La IA **no inventa** productos: solo recomienda los que existen en el catálogo.
> La conversación del chat se guarda mientras usas la app y **se borra al cerrar sesión**.

---

## 6. Instalar la app en el celular (PWA)

IA InkaShop es una **PWA**: se puede instalar como si fuera una app nativa.

- **En Android/Chrome**: menú del navegador → **"Instalar aplicación"** o **"Agregar a
  pantalla de inicio"**.
- **En iPhone/Safari**: botón **Compartir** → **"Agregar a la pantalla de inicio"**.

La app se **actualiza sola** cuando hay una versión nueva.

---

## 7. Preguntas frecuentes

**¿Necesito cuenta para mirar productos?**
No, un visitante puede explorar el catálogo. Para comprar, sí necesitas registrarte.

**Mandé una foto y dice que no la identifica.**
Prueba con una foto más clara y de cerca, o escribe una descripción como pista. La
primera búsqueda tras un rato puede tardar; reinténtala.

**¿Es seguro pagar?**
Sí. Los pagos se procesan con **Culqi** y las claves están protegidas en el servidor;
la app nunca las expone.

**El chat desapareció al cerrar sesión.**
Es correcto: por privacidad, la conversación se borra al salir. Tus compras y datos
guardados **no** se borran.

**Cambié algo y no lo veo en el celular.**
La app se actualiza sola; si no, recárgala (o ábrela de nuevo).

---

*IA InkaShop · Taller de Programación de Aplicaciones (USS) · Versión 1.0.0*
