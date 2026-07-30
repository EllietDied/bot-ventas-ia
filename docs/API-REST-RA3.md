# API REST — IA InkaShop (RA3)

API REST propia implementada con **Vercel Serverless Functions** (carpeta `api/`).
Todos los endpoints responden en **JSON**, validan el **método HTTP** y manejan errores
con los códigos `200`, `201`, `400`, `404`, `405` y `500`.

## Configuración

La API usa **Supabase** del lado del servidor. Variables de entorno (servidor, sin `VITE_`):

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=...           # clave pública usada para validar sesiones y aplicar RLS
SUPABASE_SERVICE_ROLE_KEY=...   # secreta; solo el webhook acredita recargas
```

Si no se definen, la API reutiliza `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
(las lecturas funcionan; las escrituras dependen de las políticas RLS). Si no hay
ninguna configuración, los endpoints responden `500 { "error": "Supabase no está configurado en el servidor." }`.

> La clave **nunca** se expone al frontend. El pago de los pedidos es **simulado**.

## Cómo probar

- **Producción:** `https://<tu-app>.vercel.app/api/...`
- **Local:** `npx vercel dev` (las funciones de `api/` NO corren con `npm run dev`, que solo
  levanta el frontend de Vite). En Postman/Thunder Client usa `Content-Type: application/json`.

Base URL en los ejemplos: `BASE` = la URL de tu despliegue (o `http://localhost:3000` con `vercel dev`).

---

## Productos

### GET `/api/productos` — listar
- **Método:** GET
- **URL:** `BASE/api/productos`
- **Respuesta 200:**
```json
{ "productos": [ { "id": 1, "nombre": "Mouse Gamer RGB", "categoria": "Periféricos", "precio": 89.9, "stock": 25, "estado": "disponible" } ] }
```
- **Errores:** `500` (error de servidor/Supabase).

### POST `/api/productos` — crear
- **Método:** POST
- **URL:** `BASE/api/productos`
- **Body:**
```json
{ "nombre": "Teclado Mecánico", "marca": "Redragon", "descripcion": "Switches azules", "categoria": "Periféricos", "precio": 199.0, "stock": 18, "imagen": "⌨️" }
```
  > Requiere `Authorization: Bearer <token>` y una cuenta con rol `vendedor` activa.
- **Respuesta 201:** `{ "producto": { "id": 16, "nombre": "Teclado Mecánico", ... } }`
- **Errores:** `400` (nombre/categoría faltan, precio ≤ 0, stock negativo, o no hay vendedor), `405` (método), `500`.

---

## Producto por id

### GET `/api/producto?id=1` — obtener
- **Método:** GET · **URL:** `BASE/api/producto?id=1`
- **Respuesta 200:** `{ "producto": { "id": 1, ... } }`
- **Errores:** `400` (id inválido), `404` (no existe), `500`.

### PUT `/api/producto?id=1` — actualizar (solo los campos enviados)
- **Método:** PUT · **URL:** `BASE/api/producto?id=1`
- **Body (ejemplo: cambiar precio y stock):**
```json
{ "precio": 175.0, "stock": 30 }
```
- **Respuesta 200:** `{ "producto": { "id": 1, "precio": 175, "stock": 30, "estado": "disponible" } }`
- **Errores:** `400` (id inválido, precio ≤ 0, stock negativo, sin cambios), `404`, `405`, `500`.

### DELETE `/api/producto?id=1` — eliminar
- **Método:** DELETE · **URL:** `BASE/api/producto?id=1`
- **Respuesta 200:** `{ "ok": true, "eliminado": { "id": 1, ... } }`
- **Errores:** `400` (id inválido), `404`, `405`, `500`.

---

## Pedidos

### GET `/api/pedidos` — listar (con detalle)
- **Método:** GET · **URL:** `BASE/api/pedidos`
- **Respuesta 200:**
```json
{ "pedidos": [ { "id": 5, "total": 288.9, "estado": "pendiente", "detalle_pedido": [ { "nombre": "Mouse Gamer RGB", "cantidad": 1, "precio": 89.9 } ] } ] }
```
- **Errores:** `500`.

### POST `/api/pedidos` — registrar (pago simulado)
- **Método:** POST · **URL:** `BASE/api/pedidos`
- **Body:**
```json
{ "metodoPago": "tarjeta", "items": [ { "idProducto": 1, "cantidad": 1 } ] }
```
  > Requiere `Authorization: Bearer <token>`. El usuario, nombre, precios, descuento y
  > total se obtienen y calculan dentro de PostgreSQL; los valores monetarios enviados
  > por el cliente se ignoran.
- **Respuesta 201:** `{ "pedido": { "id": 6, "estado": "pendiente", "estado_pago": "aprobado", "detalle_pedido": [ ... ] } }`
- **Errores:** `400` (items o cantidades inválidas, producto inexistente/sin stock), `401`, `405`, `500`.

---

## Pedido por id

### GET `/api/pedido?id=6` — obtener
- **Método:** GET · **URL:** `BASE/api/pedido?id=6`
- **Respuesta 200:** `{ "pedido": { "id": 6, "detalle_pedido": [ ... ] } }`
- **Errores:** `400`, `404`, `500`.

### PUT `/api/pedido?id=6` — actualizar estado
- **Método:** PUT · **URL:** `BASE/api/pedido?id=6`
- **Body:** `{ "estado": "atendido" }`  (valores: `pendiente` | `atendido`)
- **Respuesta 200:** `{ "pedido": { "id": 6, "estado": "atendido" } }`
- **Errores:** `400` (estado inválido), `404`, `405`, `500`.

### DELETE `/api/pedido?id=6` — eliminar
- **Método:** DELETE · **URL:** `BASE/api/pedido?id=6`
- **Respuesta 200:** `{ "ok": true, "eliminado": { "id": 6, ... } }`
- **Errores:** `400`, `404`, `500`.

---

## Mensajes

### GET `/api/mensajes` — listar
- **Método:** GET · **URL:** `BASE/api/mensajes`
- **Respuesta 200:** `{ "mensajes": [ { "id": 1, "texto": "¿Tiene stock?", "leido": false, "tipo": "consulta" } ] }`
- **Errores:** `500`.

### POST `/api/mensajes` — enviar
- **Método:** POST · **URL:** `BASE/api/mensajes`
- **Body:**
```json
{ "de_usuario": "<uuid-remitente>", "para_usuario": "<uuid-destinatario>", "texto": "¿Tiene stock del Mouse Gamer?", "producto_id": 1, "nombre_producto": "Mouse Gamer RGB", "tipo": "consulta" }
```
- **Respuesta 201:** `{ "mensaje": { "id": 9, "texto": "...", "leido": false } }`
- **Errores:** `400` (texto vacío, falta remitente o destinatario), `405`, `500`.

---

## Asistente IA (DeepSeek)

### POST `/api/chat` — respuesta del asistente
- **Método:** POST · **URL:** `BASE/api/chat`
- **Autorización:** `Authorization: Bearer <token de Supabase>`.
- **Body:**
```json
{ "mensaje": "Busco una laptop hasta 2500 soles", "productos": [ { "id": 13, "nombre": "Laptop HP 15", "categoria": "Laptops", "precio": 2200, "stock": 7 } ], "historial": [] }
```
- **Respuesta 200:**
```json
{ "mensaje": "Te recomiendo la Laptop HP 15...", "productosRecomendados": ["13"], "accionSugerida": "VER_PRODUCTO" }
```
- **Errores:** `400` (mensaje vacío), `401` (sesión inválida), `405`, `500` (sin `DEEPSEEK_API_KEY`), `502` (DeepSeek falló).
- **Nota:** requiere `DEEPSEEK_API_KEY` (servidor) y saldo en DeepSeek. Si falla, el frontend usa
  automáticamente la **IA simulada** (`ChatBotIA`). Nunca se envían contraseñas ni datos de pago.

---

## Resumen de códigos

| Código | Significado |
|---|---|
| 200 | OK (GET/PUT/DELETE correctos) |
| 201 | Creado (POST correcto) |
| 400 | Petición inválida (validación) |
| 401 | Falta una sesión válida |
| 403 | El rol no autoriza la operación |
| 404 | Recurso no encontrado |
| 405 | Método HTTP no permitido |
| 500 | Error interno / Supabase no configurado |
| 502 | El servicio de IA (DeepSeek) no respondió |
