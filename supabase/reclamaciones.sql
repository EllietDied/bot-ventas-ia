-- ============================================================
-- IA InkaShop · Libro de Reclamaciones (INDECOPI) integrado
-- Cómo usar: Supabase → SQL Editor → pega todo → Run. (Seguro de re-ejecutar.)
--
-- Requisito legal (Perú): el Libro de Reclamaciones debe estar INTEGRADO en la web
-- (no en Google Drive ni enlaces externos). Aquí se guarda cada hoja de reclamación.
-- ============================================================

create table if not exists public.reclamaciones (
  id bigint generated always as identity primary key,
  codigo text not null,                       -- código que se le entrega al consumidor
  tipo text not null check (tipo in ('reclamo','queja')),
  -- Datos del consumidor
  consumidor_nombre text not null,
  consumidor_documento text,
  consumidor_telefono text,
  consumidor_correo text,
  consumidor_domicilio text,
  es_menor boolean not null default false,
  -- Identificación del bien contratado
  tipo_bien text,                             -- 'producto' | 'servicio'
  monto_reclamado numeric(10,2),
  descripcion_bien text,
  -- Detalle de la reclamación
  detalle text not null,
  pedido_consumidor text,                     -- lo que pide/solicita el consumidor
  -- Metadatos
  usuario_id uuid references public.perfiles(id) on delete set null, -- si estaba logueado
  estado text not null default 'pendiente' check (estado in ('pendiente','atendido')),
  creado_en timestamptz not null default now()
);
create index if not exists idx_reclamaciones_fecha on public.reclamaciones (creado_en desc);

-- SEGURIDAD (RLS): CUALQUIER persona puede PRESENTAR un reclamo (incluso sin cuenta),
-- pero NADIE puede LISTARLOS por la API (son datos personales de terceros). El comercio
-- los revisa desde el panel de Supabase.
alter table public.reclamaciones enable row level security;
grant insert on public.reclamaciones to anon, authenticated;
create policy "reclamaciones - crear" on public.reclamaciones
  for insert with check (true);
-- (No hay policy de SELECT: nadie puede leer/enumerar los reclamos desde el cliente.)

-- ============================================================
-- Fin. El comercio ve los reclamos en Supabase → Table editor → reclamaciones.
-- ============================================================
