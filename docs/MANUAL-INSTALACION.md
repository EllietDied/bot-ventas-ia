# Manual de Instalación — IA InkaShop

> Asistente inteligente de ventas (React + TypeScript + Vite).
> Este manual explica, paso a paso, cómo instalar y poner en marcha el proyecto,
> tanto en tu computadora (desarrollo) como en la nube (producción, Vercel).

---

## Índice
1. [Requisitos previos](#1-requisitos-previos)
2. [Obtener el código](#2-obtener-el-código)
3. [Instalar dependencias](#3-instalar-dependencias)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Configurar la base de datos (Supabase)](#5-configurar-la-base-de-datos-supabase)
6. [Ejecutar en desarrollo](#6-ejecutar-en-desarrollo)
7. [Compilar para producción](#7-compilar-para-producción)
8. [Desplegar en la nube (Vercel)](#8-desplegar-en-la-nube-vercel)
9. [Configurar el webhook de pagos (Culqi)](#9-configurar-el-webhook-de-pagos-culqi)
10. [Solución de problemas frecuentes](#10-solución-de-problemas-frecuentes)

---

## 1. Requisitos previos

| Herramienta | Para qué | Cómo obtenerla |
|---|---|---|
| **Node.js 18+** y **npm** | Ejecutar y compilar el proyecto | [nodejs.org](https://nodejs.org) |
| **Git** | Descargar y versionar el código | [git-scm.com](https://git-scm.com) |
| **Editor de código** | Editar el proyecto | [Visual Studio Code](https://code.visualstudio.com) (recomendado) |
| **Cuenta de Supabase** *(opcional)* | Base de datos real y login | [supabase.com](https://supabase.com) |
| **Claves de IA/pagos** *(opcional)* | DeepSeek, NVIDIA, Culqi | Sus respectivos paneles |

> 💡 El proyecto puede funcionar en **modo local** (sin Supabase ni claves) usando el
> almacenamiento del navegador. Las cuentas y claves solo hacen falta para el **modo real**.

Para verificar que Node y npm están instalados:
```bash
node -v
npm -v
```

---

## 2. Obtener el código

```bash
git clone https://github.com/EllietDied/bot-ventas-ia.git
cd bot-ventas-ia
```

---

## 3. Instalar dependencias

```bash
npm install
```
Esto descarga todas las librerías (React, Supabase, TensorFlow.js, etc.) en la carpeta `node_modules/`.

---

## 4. Variables de entorno

Crea un archivo llamado **`.env.local`** en la raíz del proyecto (usa `.env.example` como
plantilla). **Regla de oro de seguridad:**

- Las variables con prefijo **`VITE_`** son **públicas** (llegan al navegador).
- Las variables **sin** `VITE_` son **secretas** (solo viven en el servidor). **Nunca**
  pongas una clave secreta con `VITE_`, ni la subas al repositorio.

| Variable | Tipo | Descripción |
|---|---|---|
| `VITE_USAR_SUPABASE` | Pública | `true` = base de datos real; `false` = modo local. |
| `VITE_SUPABASE_URL` | Pública | URL de tu proyecto Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Pública | Clave anónima de Supabase (protegida por RLS). |
| `VITE_USAR_IA_REAL` | Pública | `true` = usar IA real (DeepSeek/Gemma). |
| `VITE_USAR_PAGOS_REALES` | Pública | `true` = cobrar con Culqi real; `false` = pago simulado. |
| `VITE_CULQI_PUBLIC_KEY` | Pública | Llave pública de Culqi (`pk_...`). |
| `DEEPSEEK_API_KEY` | **Secreta** | Clave del asistente de conversación (servidor). |
| `NVIDIA_API_KEY` | **Secreta** | Clave de la visión Gemma (servidor). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secreta** | Clave maestra de la base (solo servidor). |
| `CULQI_SECRET_KEY` | **Secreta** | Llave privada de Culqi (`sk_...`). |
| `CULQI_WEBHOOK_SECRET` | **Secreta** | Token que protege el webhook de pagos (ver sección 9). |

> ⚠️ El archivo `.env.local` está en `.gitignore` a propósito: **nunca** debe subirse a Git.

---

## 5. Configurar la base de datos (Supabase)

Solo si usas el **modo real** (`VITE_USAR_SUPABASE=true`).

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia la **URL** y la **anon key** (Project Settings → API) a tu `.env.local`.
3. Ve a **SQL Editor** → **New query** y ejecuta los scripts de la carpeta `supabase/`
   (pega el contenido de cada archivo y pulsa **Run**), en este orden:

| Orden | Archivo | Qué crea |
|---|---|---|
| 1 | `schema.sql` | Tablas principales, RLS y bucket de fotos. |
| 2 | `seed.sql` | Productos de ejemplo. |
| 3 | `hardening.sql` | Endurecimiento de seguridad. |
| 4 | `billetera.sql` | Billetera y transacciones (saldo). |
| 5 | `pagar-con-saldo.sql` | Pago con saldo (función segura). |
| 6 | `reclamaciones.sql` | Libro de reclamaciones (INDECOPI). |
| 7 | `direcciones.sql` | Libreta de direcciones (hasta 3). |
| 8 | `envio-pedidos.sql` | Datos de envío en los pedidos. |
| 9 | `chats_asistente.sql` | Historial del chat del asistente. |
| 10 | `detalle-producto.sql` | Campos del detalle (modelo, material, galería). |
| 11 | `fix-rls-pedidos.sql` | Corrige la seguridad de pedidos. |
| 12 | `seguridad-auditoria.sql` | Correcciones de seguridad (fotos y roles). |

> Los scripts son **idempotentes** (seguros de re-ejecutar): usan `if not exists`.

---

## 6. Ejecutar en desarrollo

```bash
npm run dev
```
Abre la dirección que aparece en la terminal (por defecto **http://localhost:5173**).
Los cambios en el código se recargan al instante.

---

## 7. Compilar para producción

```bash
npm run build      # genera la versión optimizada en la carpeta dist/
npm run preview    # prueba local de esa versión compilada
```

Otros comandos útiles:
```bash
npm run test       # ejecuta las pruebas unitarias (Vitest)
```

---

## 8. Desplegar en la nube (Vercel)

1. Sube el proyecto a **GitHub**.
2. En [vercel.com](https://vercel.com), **importa** el repositorio.
3. En **Settings → Environment Variables**, agrega **todas** las variables de la sección 4
   (las públicas y las secretas). Marca el entorno **Production**.
4. Vercel construye y publica automáticamente en cada `git push` a la rama `main`.
5. Cada vez que cambies una variable de entorno, haz **Deployments → ⋮ → Redeploy**
   para que tome efecto.

> Las funciones de la carpeta `api/` se despliegan solas como **funciones serverless**
> (la API segura que habla con la IA y con Culqi).

---

## 9. Configurar el webhook de pagos (Culqi)

Necesario solo si cobras con Culqi real. Protege el webhook para que **nadie pueda
falsificar pagos**:

1. Inventa un texto secreto largo (ej. `inka_whk_xxxxxxxx...`).
2. En **Vercel**, agrégalo como variable `CULQI_WEBHOOK_SECRET`.
3. En el **panel de Culqi → Webhooks**, pon la URL así (con el token al final):
   ```
   https://TU-APP.vercel.app/api/pago-webhook?token=EL_MISMO_TEXTO_SECRETO
   ```
4. **Redeploy** en Vercel.

Para comprobar que quedó protegido: una petición **sin** el token debe devolver
**HTTP 401** (rechazada); con el token, debe pasar.

---

## 10. Solución de problemas frecuentes

| Problema | Causa probable | Solución |
|---|---|---|
| El chat no responde | `DEEPSEEK_API_KEY` mal puesta o sin redeploy | Revisa la variable en Vercel y haz Redeploy. |
| La búsqueda por foto dice "no configurado" | `NVIDIA_API_KEY` mal puesta, o Gemma "fría" | Revisa la variable (sin espacios). La 1ª foto tras un rato tarda; reintenta. |
| Los cambios no aparecen en la app | Caché de la PWA | La app se autoactualiza; si no, `Ctrl + Shift + R` dos veces. |
| "No se pudo guardar la dirección" | Falta correr un SQL con columnas nuevas | Ejecuta `direcciones.sql` en Supabase. |
| El webhook no rechaza sin token | Falta `CULQI_WEBHOOK_SECRET` o Redeploy | Agrégala en Vercel y redeploy. |

---

*IA InkaShop · Taller de Programación de Aplicaciones (USS) · Versión 1.0.0*
