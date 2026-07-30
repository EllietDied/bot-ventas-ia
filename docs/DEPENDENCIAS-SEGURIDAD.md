# Estado de seguridad de dependencias

Revisión: 29 de julio de 2026.

El frontend y las herramientas de desarrollo se actualizaron a versiones actuales:

- Vite 8 y su plugin oficial de React 6.
- Vitest 4.
- React Router 7.18.2.
- Supabase JS 2.111.

También se eliminó `@vercel/node`, que se utilizaba únicamente para dos tipos y
arrastraba numerosas dependencias vulnerables. Las funciones serverless usan ahora
un contrato de tipos local y forman parte de la comprobación de TypeScript del build.

## Excepción conocida

`npm audit` informa dos alertas altas asociadas a una misma vulnerabilidad de
React Router en **RSC Mode**. IA InkaShop es una SPA declarativa creada con Vite:
no usa React Server Components, loaders/actions de servidor ni ejecución de acciones
RSC, por lo que esa ruta vulnerable no está expuesta en esta aplicación.

No existe, a la fecha de la revisión, una versión publicada que corrija esa alerta
sin reintroducir vulnerabilidades anteriores. Se mantiene la versión más reciente
y se debe volver a ejecutar `npm audit` cuando React Router publique la corrección.
