-- ============================================================
-- IA InkaShop · Esquema de Supabase (PostgreSQL)
-- Paso 1 de la migración: TABLAS + SEGURIDAD (RLS) + STORAGE.
-- Cómo usar: Supabase → SQL Editor → pega todo → Run.
-- El correo y la contraseña los maneja Supabase Auth (no se guardan aquí).
-- ============================================================

-- ============================================================
-- 1) TABLAS
-- ============================================================

-- ---------- PERFILES (datos del usuario; 1 fila por cuenta de Auth) ----------
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  correo text,
  nombre text not null,
  apellido text not null,
  telefono text,
  prefijo_telefonico text,
  telefono_internacional text,
  rol text not null default 'comprador' check (rol in ('comprador','vendedor')),
  sexo text check (sexo in ('masculino','femenino')),
  estado text not null default 'activo',
  -- País y documento de identidad
  pais_codigo text,
  pais_nombre text,
  tipo_documento text,
  documento_numero text,        -- normalizado (texto: conserva ceros)
  documento_display text,
  documento_complemento text,
  -- Dirección territorial (códigos como texto)
  codigo_postal text,
  nivel1_tipo text, nivel1_codigo text, nivel1_nombre text,
  nivel2_tipo text, nivel2_codigo text, nivel2_nombre text,
  nivel3_tipo text, nivel3_codigo text, nivel3_nombre text,
  direccion text,
  creado_en timestamptz not null default now()
);

-- ---------- PRODUCTOS ----------
create table if not exists public.productos (
  id bigint generated always as identity primary key,
  nombre text not null,
  marca text,
  descripcion text,
  categoria text not null,
  precio numeric(10,2) not null check (precio > 0),
  stock integer not null default 0 check (stock >= 0),
  estado text not null default 'disponible',
  imagen text,                  -- URL de Storage (o emoji por defecto)
  id_vendedor uuid not null references public.perfiles(id) on delete cascade,
  vendedor_nombre text,         -- nombre del vendedor (copia, para mostrar sin leer su perfil)
  creado_en timestamptz not null default now()
);
create index if not exists idx_productos_categoria on public.productos (categoria);
create index if not exists idx_productos_vendedor  on public.productos (id_vendedor);

-- ---------- PEDIDOS + DETALLE ----------
create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  id_comprador uuid not null references public.perfiles(id) on delete cascade,
  correo_comprador text, -- correo del comprador (copia, para mostrarlo sin leer su perfil)
  subtotal numeric(10,2) not null,
  descuento numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  metodo_pago text not null,
  banco text,
  estado text not null default 'pendiente' check (estado in ('pendiente','atendido')),
  estado_pago text not null default 'aprobado',
  creado_en timestamptz not null default now()
);
create index if not exists idx_pedidos_comprador on public.pedidos (id_comprador);
create index if not exists idx_pedidos_fecha      on public.pedidos (creado_en); -- Cola FIFO: order by creado_en asc

create table if not exists public.detalle_pedido (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos(id) on delete cascade,
  producto_id bigint references public.productos(id) on delete set null,
  nombre text not null,         -- copia del nombre al momento de la compra
  cantidad integer not null check (cantidad > 0),
  precio numeric(10,2) not null
);
create index if not exists idx_detalle_pedido on public.detalle_pedido (pedido_id);

-- ---------- CONSULTAS (Pila LIFO: order by creado_en desc) ----------
create table if not exists public.consultas (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  termino text not null,
  categoria text,
  creado_en timestamptz not null default now()
);
create index if not exists idx_consultas_usuario on public.consultas (usuario_id, creado_en desc);

-- ---------- MENSAJES (comprador <-> vendedor, RF10) ----------
create table if not exists public.mensajes (
  id bigint generated always as identity primary key,
  producto_id bigint references public.productos(id) on delete set null,
  nombre_producto text, -- copia del nombre del producto (para mostrarlo sin join)
  de_usuario uuid not null references public.perfiles(id) on delete cascade,
  para_usuario uuid not null references public.perfiles(id) on delete cascade,
  de_nombre text, -- nombre del remitente (copia, para mostrar sin leer su perfil)
  para_nombre text, -- nombre del destinatario (copia)
  tipo text not null default 'consulta', -- 'consulta' | 'respuesta'
  texto text not null,
  leido boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists idx_mensajes_para on public.mensajes (para_usuario, leido);

-- ============================================================
-- 2) AL CREAR UN USUARIO EN AUTH, SE CREA SU PERFIL
--    (los datos llegan en el "metadata" del signUp del frontend)
-- ============================================================
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (
    id, correo, nombre, apellido, telefono, prefijo_telefonico, telefono_internacional, rol, sexo,
    pais_codigo, pais_nombre, tipo_documento, documento_numero, documento_display,
    documento_complemento, codigo_postal,
    nivel1_tipo, nivel1_codigo, nivel1_nombre,
    nivel2_tipo, nivel2_codigo, nivel2_nombre,
    nivel3_tipo, nivel3_codigo, nivel3_nombre, direccion
  )
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'nombre',''),
    coalesce(new.raw_user_meta_data->>'apellido',''),
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'prefijo_telefonico',
    new.raw_user_meta_data->>'telefono_internacional',
    coalesce(new.raw_user_meta_data->>'rol','comprador'),
    nullif(new.raw_user_meta_data->>'sexo',''),
    new.raw_user_meta_data->>'pais_codigo',
    new.raw_user_meta_data->>'pais_nombre',
    new.raw_user_meta_data->>'tipo_documento',
    new.raw_user_meta_data->>'documento_numero',
    new.raw_user_meta_data->>'documento_display',
    new.raw_user_meta_data->>'documento_complemento',
    new.raw_user_meta_data->>'codigo_postal',
    new.raw_user_meta_data->>'nivel1_tipo', new.raw_user_meta_data->>'nivel1_codigo', new.raw_user_meta_data->>'nivel1_nombre',
    new.raw_user_meta_data->>'nivel2_tipo', new.raw_user_meta_data->>'nivel2_codigo', new.raw_user_meta_data->>'nivel2_nombre',
    new.raw_user_meta_data->>'nivel3_tipo', new.raw_user_meta_data->>'nivel3_codigo', new.raw_user_meta_data->>'nivel3_nombre',
    new.raw_user_meta_data->>'direccion'
  );
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- El trigger ejecuta la función igual, pero NADIE debe poder llamarla desde la API.
revoke execute on function public.crear_perfil() from public, anon, authenticated;

-- ============================================================
-- 3) SEGURIDAD: Row Level Security (RLS)
--    Cada quien solo accede a lo suyo; el catálogo es público.
-- ============================================================
alter table public.perfiles        enable row level security;
alter table public.productos       enable row level security;
alter table public.pedidos         enable row level security;
alter table public.detalle_pedido  enable row level security;
alter table public.consultas       enable row level security;
alter table public.mensajes        enable row level security;

-- Permisos base para los roles del API (RLS sigue filtrando fila por fila)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.productos to anon;

-- ---------- PERFILES: cada quien gestiona solo su propio perfil ----------
create policy "perfil propio - leer"   on public.perfiles for select using (auth.uid() = id);
create policy "perfil propio - editar" on public.perfiles for update using (auth.uid() = id);
-- (el INSERT lo hace el trigger con security definer; no se necesita policy de insert)
-- Nota: los nombres a mostrar se guardan ya copiados en productos.vendedor_nombre,
-- mensajes.de_nombre/para_nombre, etc., así que NO hace falta exponer perfiles.

-- ---------- PRODUCTOS: catálogo visible para todos; solo vendedores activos ----------
create policy "productos - leer"   on public.productos for select using (true);
create policy "productos - crear" on public.productos for insert with check (
  (select auth.uid()) = id_vendedor
  and exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'vendedor' and estado = 'activo'
  )
);
create policy "productos - editar" on public.productos for update using (
  (select auth.uid()) = id_vendedor
  and exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'vendedor' and estado = 'activo'
  )
) with check (
  (select auth.uid()) = id_vendedor
  and exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'vendedor' and estado = 'activo'
  )
);
create policy "productos - borrar" on public.productos for delete using (
  (select auth.uid()) = id_vendedor
  and exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'vendedor' and estado = 'activo'
  )
);

-- ---------- PEDIDOS: el comprador ve/crea los suyos; el vendedor ve los que tienen sus productos ----------
create policy "pedidos - crear" on public.pedidos for insert
  with check (auth.uid() = id_comprador);
create policy "pedidos - leer" on public.pedidos for select using (
  auth.uid() = id_comprador
  or exists (
    select 1 from public.detalle_pedido d
    join public.productos p on p.id = d.producto_id
    where d.pedido_id = pedidos.id and p.id_vendedor = auth.uid()
  )
);
create policy "pedidos - atender" on public.pedidos for update using (
  exists (
    select 1 from public.detalle_pedido d
    join public.productos p on p.id = d.producto_id
    where d.pedido_id = pedidos.id and p.id_vendedor = auth.uid()
  )
);

-- ---------- DETALLE: visible/insertable según el acceso al pedido ----------
create policy "detalle - leer" on public.detalle_pedido for select using (
  exists (select 1 from public.pedidos o where o.id = pedido_id) -- el RLS de pedidos ya filtra
);
create policy "detalle - crear" on public.detalle_pedido for insert with check (
  exists (select 1 from public.pedidos o where o.id = pedido_id and o.id_comprador = auth.uid())
);

-- ---------- CONSULTAS (Pila LIFO): cada quien gestiona las suyas ----------
create policy "consultas - propias" on public.consultas
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- ---------- MENSAJES: emisor y receptor leen; solo el emisor envía; el receptor marca leído ----------
create policy "mensajes - leer" on public.mensajes for select using (
  auth.uid() = de_usuario or auth.uid() = para_usuario
);
create policy "mensajes - enviar" on public.mensajes for insert with check (auth.uid() = de_usuario);
create policy "mensajes - marcar leido" on public.mensajes for update using (auth.uid() = para_usuario);

-- ============================================================
-- 4) STORAGE: bucket público para las fotos de productos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

-- Las fotos públicas se sirven por su URL pública (bucket public), sin policy de
-- SELECT; así nadie puede LISTAR/enumerar los archivos del bucket.
create policy "fotos - subir" on storage.objects for insert to authenticated with check (
  bucket_id = 'productos'
  and exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'vendedor' and estado = 'activo'
  )
);
create policy "fotos - editar" on storage.objects for update to authenticated using (
  bucket_id = 'productos' and owner = (select auth.uid())
);
create policy "fotos - borrar" on storage.objects for delete to authenticated using (
  bucket_id = 'productos' and owner = (select auth.uid())
);

-- ============================================================
-- Fin del esquema. (La capa de IA es aparte: no toca estas tablas.)
-- ============================================================
