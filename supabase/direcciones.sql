-- ============================================================
-- IA InkaShop · Libreta de direcciones del cliente (hasta 3)
-- Cómo usar: Supabase → SQL Editor → pega todo → Run. (Seguro de re-ejecutar.)
-- ============================================================

create table if not exists public.direcciones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  receptor text not null,
  telefono text,
  direccion text not null,
  referencia text,
  creado_en timestamptz not null default now()
);
create index if not exists idx_direcciones_usuario on public.direcciones (usuario_id);

-- SEGURIDAD (RLS): cada quien gestiona SOLO sus propias direcciones.
alter table public.direcciones enable row level security;
grant select, insert, update, delete on public.direcciones to authenticated;

drop policy if exists "direcciones propias" on public.direcciones;
create policy "direcciones propias" on public.direcciones
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- Límite de 3 direcciones por usuario (se valida también en el cliente).
create or replace function public.limite_direcciones()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.direcciones where usuario_id = new.usuario_id) >= 3 then
    raise exception 'Solo puedes guardar hasta 3 direcciones.';
  end if;
  return new;
end;
$$;

drop trigger if exists tr_limite_direcciones on public.direcciones;
create trigger tr_limite_direcciones
  before insert on public.direcciones
  for each row execute function public.limite_direcciones();

-- ============================================================
-- Fin. La dirección elegida se copia al pedido (ver envío en pedidos).
-- ============================================================
