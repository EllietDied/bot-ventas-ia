-- ============================================================
-- IA InkaShop · Datos de envío en el pedido
-- Cómo usar: Supabase → SQL Editor → pega todo → Run. (Seguro de re-ejecutar.)
--
-- Guarda una COPIA de la dirección elegida en el propio pedido (queda como histórico
-- aunque el cliente luego borre esa dirección de su libreta).
-- ============================================================

alter table public.pedidos
  add column if not exists envio_receptor     text,
  add column if not exists envio_telefono     text,
  add column if not exists envio_direccion    text,
  add column if not exists envio_referencia   text,
  add column if not exists envio_dni          text,
  add column if not exists envio_departamento text,
  add column if not exists envio_provincia    text,
  add column if not exists envio_distrito     text,
  add column if not exists envio_correo       text;

-- ============================================================
-- Fin. La app las escribe tras elegir la dirección (actualizarEnvioSupabase).
-- ============================================================
