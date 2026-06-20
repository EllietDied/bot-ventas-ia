# IA InkaShop

## Asistente inteligente de ventas multiplataforma

**Lema:** *Compra con respaldo, vende con innovación.*

IA InkaShop es una aplicación web académica desarrollada con **React, TypeScript y Vite** para el curso **Taller de Aplicaciones** de la **Universidad Señor de Sipán**, correspondiente al cuarto ciclo.

El proyecto implementa los principales componentes definidos en el RA1, entre ellos la arquitectura por capas, las clases representadas en el modelo UML y el uso de estructuras de datos como listas, colas FIFO y pilas LIFO. Asimismo, se presenta como una **Progressive Web App (PWA)** instalable y adaptable a computadoras y dispositivos móviles.

La aplicación está orientada a la asistencia inteligente en procesos de compra y venta. El comprador puede interactuar con un asistente que recomienda productos según categorías, necesidades de uso, presupuesto e historial de consultas. El sistema acompaña al usuario desde la búsqueda inicial hasta el registro del pedido.

A diferencia de una tienda electrónica convencional con un chatbot complementario, IA InkaShop plantea al asistente inteligente como el componente principal de interacción, mientras que el catálogo funciona como soporte para la toma de decisiones.

> La inteligencia artificial, el procesamiento de pagos y las operaciones comerciales se encuentran simulados con fines académicos. La aplicación no utiliza servicios externos ni backend; la persistencia de datos se realiza mediante `localStorage`.

**Autores:**

- Beryher Agip
- Andherson Mendoza
- Fabricio Salazar
- Andrea Odar

---

## 1. Requisitos del sistema

Para ejecutar el proyecto se requiere:

- Node.js versión 18 o superior.
- npm, incluido con la instalación de Node.js.
- Un navegador web actualizado.

---

## 2. Instalación y ejecución

Desde la carpeta raíz del proyecto, ejecutar los siguientes comandos:

```bash
npm install
npm run dev
```

El primer comando instala las dependencias del proyecto. El segundo inicia el servidor de desarrollo.

Una vez iniciado el entorno, se debe abrir en el navegador la dirección indicada en la consola. De forma predeterminada, Vite suele utilizar:

```text
http://localhost:5173
```

### Comandos disponibles

```bash
npm run dev
```

Inicia la aplicación en modo de desarrollo.

```bash
npm run build
```

Compila el proyecto, verifica TypeScript y genera la carpeta `dist/`.

```bash
npm run preview
```

Permite visualizar localmente la versión compilada.

```bash
npm run test
```

Ejecuta las pruebas automatizadas mediante Vitest.

---

## 3. Cuentas de prueba

| Rol | Correo electrónico | Contraseña |
|---|---|---|
| Comprador | `comprador@demo.com` | `123456` |
| Vendedor | `vendedor@demo.com` | `123456` |

Para restablecer los datos almacenados localmente:

1. Abrir las herramientas de desarrollo del navegador.
2. Ingresar a **Application**.
3. Seleccionar **Local Storage**.
4. Eliminar los datos almacenados para la aplicación.

---

## 4. Alcance multiplataforma y PWA

IA InkaShop se encuentra implementada como una **Progressive Web App** adaptable e instalable en computadoras y dispositivos móviles.

La aplicación puede agregarse a la pantalla de inicio y ejecutarse en una ventana independiente mediante el modo `standalone`. Sin embargo, no corresponde a una aplicación móvil nativa, por lo que no se distribuye como archivo APK ni mediante una tienda de aplicaciones.

Las integraciones con Telegram, WhatsApp u otras plataformas se consideran mejoras futuras contempladas en la propuesta académica, pero no están implementadas en la versión actual.

La guía de instalación de la PWA se encuentra disponible en [`COMO-EJECUTAR.md`](COMO-EJECUTAR.md).

---

## 5. Arquitectura del proyecto

El proyecto aplica una arquitectura organizada por responsabilidades. Su estructura se distribuye de la siguiente manera:

| Capa | Ubicación | Responsabilidad principal |
|---|---|---|
| Presentación | `src/paginas`, `src/componentes` | Interfaces, pantallas y componentes visuales desarrollados con React |
| Lógica de negocio | `src/contexto`, `src/core/servicios` | Gestión del estado, reglas del sistema y algoritmos principales |
| Persistencia de datos | `src/core/datos` | Almacenamiento local y carga de datos de ejemplo |
| Modelos y estructuras | `src/core/modelos`, `src/core/estructuras` | Definición de entidades, clases, interfaces y estructuras de datos |

### Estructura de directorios

```text
src/
├── core/
│   ├── modelos/          Clases e interfaces del modelo UML
│   ├── estructuras/      Implementaciones de ColaPedidos y PilaConsultas
│   ├── servicios/        Servicios de autenticación, búsqueda y lógica asociada
│   └── datos/            Persistencia mediante localStorage y datos iniciales
├── contexto/             Gestión del estado global mediante React Context
├── componentes/          Componentes reutilizables de la interfaz
└── paginas/              Pantallas principales de la aplicación
```

---

## 6. Modelo de clases UML

Las clases e interfaces principales se encuentran en `src/core/modelos`.

La relación de herencia general se representa de la siguiente manera:

```text
Persona → Usuario → Comprador / Vendedor
```

En TypeScript, estas relaciones se implementan mediante herencia entre interfaces y clases, según corresponda.

| Entidad | Tipo | Descripción |
|---|---|---|
| `Persona` | Interface | Contiene los datos personales básicos del usuario |
| `Usuario` | Interface | Extiende a `Persona` e incorpora correo, contraseña y rol |
| `Comprador` | Interface | Especialización de `Usuario` con rol de comprador |
| `Vendedor` | Interface | Especialización de `Usuario` con rol de vendedor |
| `Producto` | Interface | Representa los artículos disponibles en el catálogo |
| `Pedido` | Interface | Contiene los datos generales, estado y totales de una compra |
| `DetallePedido` | Interface | Representa cada producto incluido en un pedido |
| `Pago` | Interface | Registra la información simulada de pago |
| `Mensaje` | Interface | Representa la comunicación entre comprador y vendedor correspondiente al RF10 |
| `MensajeBot` | Interface | Representa los mensajes intercambiados con el asistente |
| `Carrito` | Clase | Gestiona productos, cantidades, subtotal, descuento y total |
| `ChatBotIA` | Clase | Procesa consultas simuladas y genera recomendaciones de productos |

---

## 7. Estructuras de datos implementadas

El sistema utiliza las siguientes estructuras:

| Estructura | Implementación | Aplicación en el sistema |
|---|---|---|
| Lista | Arreglos de tipo `Producto[]`, `Usuario[]`, `Pedido[]` y `Mensaje[]` | Almacenamiento y gestión de las colecciones principales |
| Cola FIFO | `ColaPedidos` en `src/core/estructuras` | Atención de pedidos según el orden de llegada |
| Pila LIFO | `PilaConsultas` en `src/core/estructuras` | Registro de consultas recientes, mostrando primero la última realizada |

La cola FIFO se emplea en la gestión de pedidos pendientes. La pila LIFO se utiliza en el historial reciente del asistente. Las listas permiten administrar usuarios, productos, pedidos y mensajes.

---

## 8. Correspondencia entre algoritmos del RA1 y el código

| Algoritmo definido en el RA1 | Implementación |
|---|---|
| `IniciarSesion` | `core/servicios/AuthService.ts` → `iniciarSesion` |
| `ConsultarProducto` | `core/servicios/CatalogoService.ts` → `buscarProductos` |
| `RecomendarProducto` | `core/modelos/ChatBotIA.ts` → `recomendarProducto` |
| `RegistrarPedido` / `ProcesarPago` | `contexto/PedidosContext.tsx` → `registrarPedido` |
| `ResponderConsultaChatBot` | `core/modelos/ChatBotIA.ts` → `responderConsulta` |

---

## 9. Funcionalidades principales

### 9.1. Asistente inteligente de ventas

El comprador interactúa con el asistente desde la pantalla principal. Las recomendaciones se generan a partir de:

- Texto ingresado por el usuario.
- Categoría del producto.
- Presupuesto disponible.
- Historial de consultas.
- Productos populares.

Las recomendaciones se muestran mediante tarjetas integradas en la conversación, con opciones para consultar detalles, agregar productos al carrito, comparar alternativas o contactar al vendedor.

### 9.2. Catálogo de productos

El sistema dispone de una sección complementaria para explorar el catálogo, realizar búsquedas y filtrar productos por categoría.

### 9.3. Autenticación y gestión de roles

La aplicación permite el registro e inicio de sesión de compradores y vendedores. Cada rol accede únicamente a las funciones que le corresponden mediante rutas protegidas.

### 9.4. Carrito, pedidos y pagos simulados

El comprador puede agregar productos al carrito, modificar cantidades y completar un proceso de pago guiado. El sistema calcula:

- Subtotal.
- Descuento aplicable.
- Total de la compra.

La disponibilidad de stock se valida tanto al agregar productos como al confirmar el pedido.

### 9.5. Panel del vendedor

El vendedor puede:

- Publicar productos.
- Actualizar existencias.
- Revisar pedidos pendientes.
- Consultar mensajes recibidos.
- Visualizar sugerencias generadas por el asistente.

Las sugerencias consideran productos con bajo stock, artículos más consultados, mensajes pendientes y pedidos por atender.

### 9.6. Mensajería

El sistema incorpora comunicación entre comprador y vendedor asociada a un producto específico. Los mensajes manejan estados de lectura y no lectura, de acuerdo con el requerimiento funcional RF10.

### 9.7. Historiales

Se registra el historial de pedidos y de consultas realizadas al asistente.

### 9.8. Apariencia e identidad visual

La interfaz incluye modo claro y modo oscuro. La preferencia seleccionada se almacena en `localStorage`.

También se incorpora la identidad institucional de la Universidad Señor de Sipán en componentes como la barra de navegación, el registro, el asistente, el pie de página y los iconos de la PWA.

La mascota visual del sistema se encuentra en:

```text
public/assistant-inkashop.svg
```

Esta ilustración representa un asistente tecnológico con elementos gráficos andinos y se adapta a los modos claro y oscuro.

---

## 10. Validaciones implementadas

El sistema incorpora las siguientes validaciones:

- Verificación de campos obligatorios en inicio de sesión, registro y publicación de productos.
- Validación del formato del correo electrónico.
- Prevención de correos duplicados.
- Contraseña con una longitud mínima de seis caracteres.
- Confirmación de contraseña coincidente.
- Control de stock disponible en el carrito y antes de confirmar el pago.
- Precio mayor que cero y stock no negativo para productos registrados por vendedores.
- Restricción de acceso según el rol del usuario.
- Prevención del proceso de pago cuando el carrito está vacío.
- Prevención del envío de mensajes o respuestas vacías.

---

## 11. Pruebas automatizadas

El proyecto incluye **34 pruebas automatizadas** desarrolladas con Vitest. Estas pruebas verifican la lógica del núcleo de la aplicación sin depender de la interfaz gráfica.

Las pruebas cubren:

- Comportamiento de la cola FIFO `ColaPedidos`.
- Comportamiento de la pila LIFO `PilaConsultas`.
- Cálculo de subtotal, descuento y total del carrito.
- Descuentos del 5 % y 10 %.
- Validaciones de inicio de sesión y registro.
- Búsqueda de productos.
- Recomendaciones generadas por el chatbot simulado.

Para ejecutar las pruebas:

```bash
npm run test
```

---

## 12. Flujo general de la aplicación

1. El usuario inicia sesión o se registra seleccionando un rol.
2. El comprador accede al asistente, solicita recomendaciones y agrega productos al carrito.
3. El comprador puede completar el pago simulado, enviar consultas al vendedor y revisar su historial.
4. El vendedor accede a su panel, publica productos, actualiza stock y responde mensajes.
5. Cada pedido se incorpora a una cola FIFO de pendientes.
6. La opción **Atender siguiente** procesa el pedido más antiguo.
7. Cada búsqueda o consulta se registra en una pila LIFO de consultas recientes.
8. El historial de consultas contribuye a generar nuevas recomendaciones.

---

## 13. Tecnologías utilizadas

- React 18.
- TypeScript en modo estricto.
- Vite.
- React Router.
- React Context.
- `localStorage`.
- Vitest.
- Progressive Web App mediante `manifest` y `service worker`.
- Variables CSS para la implementación de los modos claro y oscuro.

---

## 14. Documentación complementaria

En la raíz del proyecto se encuentra el archivo:

- [`COMO-EJECUTAR.md`](COMO-EJECUTAR.md): guía de instalación, ejecución e instalación de la PWA.

En la carpeta [`docs/`](docs) se encuentran:

- `guia-demostracion-RA2.md`: guion de apoyo para la sustentación del proyecto.
- `capturas.md`: relación de capturas de pantalla recomendadas para la presentación.

---

## 15. Despliegue en GitHub y Vercel

### 15.1. Publicación del repositorio en GitHub

Se requiere tener Git instalado y disponer de una cuenta en GitHub.

Crear un repositorio vacío y ejecutar, desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "IA InkaShop - PWA"
git branch -M main
git remote add origin https://github.com/USUARIO/bot-ventas-ia.git
git push -u origin main
```

Debe reemplazarse `USUARIO` por el nombre de usuario correspondiente en GitHub.

El archivo `.gitignore` evita la inclusión de directorios y archivos locales como `node_modules`, `dist` y otros recursos generados durante el desarrollo.

### 15.2. Despliegue en Vercel

1. Ingresar a Vercel utilizando una cuenta de GitHub.
2. Seleccionar **Add New** y luego **Project**.
3. Importar el repositorio `bot-ventas-ia`.
4. Verificar la configuración detectada por Vercel:

```text
Build Command: npm run build
Output Directory: dist
```

5. Ejecutar el despliegue.
6. Utilizar la URL pública generada por Vercel.

No se requieren variables de entorno para esta versión.

Cada actualización enviada a la rama `main` mediante `git push` genera un nuevo despliegue automático.

El archivo `vercel.json` se incluye para garantizar el funcionamiento correcto de rutas como `/carrito`, `/mensajes` y `/pedidos` después de actualizar el navegador.

---

## 16. Verificación posterior al despliegue

Después de publicar la aplicación, se recomienda comprobar lo siguiente:

1. La página de inicio de sesión carga correctamente.
2. Las cuentas de prueba permiten acceder al sistema.
3. Las rutas internas funcionan después de actualizar el navegador.
4. El asistente, el catálogo, el carrito, los pedidos y la mensajería operan correctamente.
5. La aplicación puede instalarse como PWA.
6. La interfaz se adapta a dispositivos móviles.
7. Los archivos principales permanecen disponibles después de una primera carga, de acuerdo con la configuración del `service worker`.
8. Los datos se almacenan de manera independiente en el `localStorage` de cada navegador o dispositivo.

---

## 17. Limitaciones de la versión académica

La versión actual presenta las siguientes limitaciones:

- No utiliza backend ni base de datos remota.
- No incorpora autenticación real mediante servicios externos.
- La inteligencia artificial se encuentra simulada mediante reglas y lógica local.
- Los pagos no se procesan a través de una pasarela real.
- La información se almacena únicamente en el navegador del usuario.
- Las integraciones con servicios de mensajería aún no están implementadas.

Estas limitaciones responden al alcance académico definido para el proyecto y permiten demostrar la arquitectura, la lógica de negocio, las estructuras de datos y los flujos funcionales principales.

---

## 18. Integración opcional con inteligencia artificial

El asistente de IA InkaShop funciona en **dos modos**, sin perder ninguna de las funcionalidades académicas:

- **Modo simulado (por defecto):** utiliza la clase `ChatBotIA` con reglas y palabras clave. Funciona **sin conexión**, sin clave y sin costo. Es el modo activo en la versión estándar del proyecto y conserva todas las estructuras de datos (Pila LIFO, Cola FIFO) y algoritmos.
- **Modo IA real (opcional):** utiliza la **API de DeepSeek** (modelo `deepseek-chat`, compatible con OpenAI) a través de una función segura del servidor en `api/chat.ts`. Comprende lenguaje natural, mantiene el contexto reciente de la conversación y recomienda **solo productos reales del catálogo**.

La integración con DeepSeek es una **ampliación** del proyecto, no un reemplazo: la Pila LIFO sigue registrando cada consulta, la Cola FIFO sigue procesando los pedidos, y **los pagos y pedidos los sigue controlando la aplicación**, nunca el modelo.

### 18.1. Instalación de dependencias

```bash
npm install
npm install -D @vercel/node
```

### 18.2. Configuración para desarrollo (`.env.local`)

Copia el archivo `.env.example` como `.env.local` (este archivo está ignorado por git, por lo que la clave nunca se sube al repositorio):

```bash
VITE_USAR_IA_REAL=true
DEEPSEEK_API_KEY=sk-tu-clave-secreta
```

- `DEEPSEEK_API_KEY`: la clave de DeepSeek. **Solo se usa en el servidor** (`api/chat.ts`). **Nunca** debe empezar con `VITE_` ni colocarse en componentes, `localStorage` o el frontend.
- `VITE_USAR_IA_REAL`: interruptor del modo. `true` activa la IA real; cualquier otro valor (o ausencia) mantiene el **modo simulado**.

> El modo IA real requiere desplegar la función `api/chat.ts` (por ejemplo en Vercel). El servidor de desarrollo de Vite (`npm run dev`) **no** ejecuta funciones serverless; para probar la IA real en local se usa `vercel dev`. Si la app no encuentra el servicio, **usa automáticamente el modo simulado**.

### 18.3. Ejecución y comandos

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo (modo simulado)
npm run build    # verifica TypeScript y compila a dist/
npm run test     # ejecuta las pruebas automatizadas
```

### 18.4. Configuración de variables en Vercel

1. En el proyecto de Vercel: **Settings → Environment Variables**.
2. Agregar `DEEPSEEK_API_KEY` con la clave secreta (marcada como *Secret*; queda solo en el servidor).
3. Agregar `VITE_USAR_IA_REAL` con el valor `true` para activar la IA real en el sitio publicado.
4. Volver a desplegar para aplicar las variables.

La función `api/chat.ts` se despliega automáticamente como *Serverless Function* (Vercel detecta la carpeta `api/`). El archivo `vercel.json` excluye la ruta `/api` de la reescritura de la SPA para que la función responda correctamente.

### 18.5. Consideraciones

- **Seguridad:** la clave de DeepSeek vive **solo en el servidor**. El frontend únicamente hace `fetch('/api/chat')`; lo único público es el interruptor `VITE_USAR_IA_REAL`.
- **Costo:** el uso de la API de DeepSeek **puede generar costos** según el consumo de la cuenta.
- **Conexión:** el modo IA real **requiere conexión a internet**.
- **Tolerancia a fallos:** si la API falla, no responde a tiempo o no está configurada, la aplicación **usa automáticamente el modo simulado**, de forma transparente para el usuario.
- **Privacidad:** a la API solo se envía el mensaje, un historial breve, el catálogo relevante y el carrito; **nunca** contraseñas, datos de pago ni información privada.
