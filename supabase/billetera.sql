-- ============================================================
-- IA InkaShop · Billetera virtual + transacciones (Fase 1)
-- Cómo usar: Supabase → SQL Editor → pega todo → Run.
-- Es seguro correrlo varias veces (usa "if not exists" / "or replace").
--
-- REGLA DE ORO DE SEGURIDAD:
--   El SALDO solo lo modifica el SERVIDOR (funciones serverless con la service role,
--   o una función RPC con security definer). El cliente (navegador) SOLO PUEDE LEER
--   su billetera y sus transacciones. Así nadie puede "regalarse" saldo.
-- ============================================================

-- ---------- BILLETERAS (1 fila por usuario, su saldo) ----------
create table if not exists public.billeteras (
  id uuid primary key references public.perfiles(id) on delete cascade, -- = id del usuario
  saldo numeric(10,2) not null default 0 check (saldo >= 0),            -- nunca negativo
  actualizado_en timestamptz not null default now()
);

-- ---------- TRANSACCIONES (cada movimiento de dinero/saldo) ----------
create table if not exists public.transacciones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  -- recarga: suma saldo (entra dinero por la pasarela)
  -- compra_saldo: resta saldo (paga un pedido con su billetera)
  -- compra_directa: pago de un pedido por la pasarela (no toca el saldo)
  tipo text not null check (tipo in ('recarga','compra_saldo','compra_directa')),
  monto numeric(10,2) not null check (monto > 0),
  -- pendiente: esperando el pago (p. ej. el CIP de PagoEfectivo aún no se paga)
  -- aprobado: pago confirmado por la pasarela (vía webhook)
  -- rechazado / expirado: no se concretó
  estado text not null default 'pendiente'
    check (estado in ('pendiente','aprobado','rechazado','expirado')),
  metodo text,                 -- 'tarjeta' | 'yape' | 'pagoefectivo' | 'saldo'
  referencia_externa text,     -- id del cargo/orden en Culqi (clave para NO acreditar dos veces)
  cip text,                    -- código CIP de PagoEfectivo (cuando aplique)
  pedido_id bigint references public.pedidos(id) on delete set null, -- si la transacción paga un pedido
  creado_en timestamptz not null default now()
);
create index if not exists idx_transacciones_usuario on public.transacciones (usuario_id, creado_en desc);
-- Idempotencia: una referencia de pasarela no se puede registrar dos veces.
create unique index if not exists idx_transacciones_ref
  on public.transacciones (referencia_externa) where referencia_externa is not null;

-- ============================================================
-- SEGURIDAD (RLS): el cliente SOLO LEE lo suyo; el servidor escribe.
-- ============================================================
alter table public.billeteras    enable row level security;
alter table public.transacciones enable row level security;

-- El cliente puede LEER (no escribir) su billetera y sus transacciones.
grant select on public.billeteras    to authenticated;
grant select on public.transacciones to authenticated;

create policy "billetera propia - leer" on public.billeteras
  for select using (auth.uid() = id);
create policy "transacciones propias - leer" on public.transacciones
  for select using (auth.uid() = usuario_id);
-- (NO hay policies de insert/update/delete: solo la service role del servidor escribe,
--  y la service role omite RLS. Así el saldo nunca se toca desde el navegador.)

-- ============================================================
-- Cada usuario tiene su billetera automáticamente.
-- ============================================================
-- 1) Para los usuarios que ya existen (saldo 0).
insert into public.billeteras (id, saldo)
  select id, 0 from public.perfiles
  on conflict (id) do nothing;

-- 2) Para los que se registren de ahora en adelante (trigger al crear el perfil).
create or replace function public.crear_billetera()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.billeteras (id, saldo) values (new.id, 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_perfil_billetera on public.perfiles;
create trigger al_crear_perfil_billetera
  after insert on public.perfiles
  for each row execute function public.crear_billetera();

-- El trigger ejecuta la función igual; nadie debe poder llamarla desde la API.
revoke execute on function public.crear_billetera() from public, anon, authenticated;

-- ============================================================
-- Acreditar una recarga confirmada por Culqi de forma ATÓMICA.
-- La transacción y el nuevo saldo se guardan juntas o no se guarda ninguna.
-- El índice único de referencia_externa vuelve idempotentes los reintentos.
-- ============================================================
create or replace function public.procesar_pago_culqi(
  p_usuario uuid,
  p_monto numeric,
  p_metodo text,
  p_referencia text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_transaccion_id bigint;
begin
  if p_usuario is null
     or p_monto is null or p_monto <= 0 or p_monto > 5000
     or p_referencia is null or length(trim(p_referencia)) = 0 then
    raise exception 'Datos de pago inválidos';
  end if;

  insert into public.transacciones (
    usuario_id, tipo, monto, estado, metodo, referencia_externa
  )
  values (
    p_usuario, 'recarga', round(p_monto, 2), 'aprobado',
    left(coalesce(p_metodo, 'culqi'), 30), left(trim(p_referencia), 120)
  )
  on conflict (referencia_externa) where referencia_externa is not null
  do nothing
  returning id into v_transaccion_id;

  if v_transaccion_id is null then
    return jsonb_build_object('ok', true, 'duplicado', true);
  end if;

  update public.billeteras
     set saldo = saldo + round(p_monto, 2),
         actualizado_en = now()
   where id = p_usuario;

  if not found then
    raise exception 'El usuario no tiene billetera';
  end if;

  return jsonb_build_object(
    'ok', true,
    'duplicado', false,
    'acreditado', round(p_monto, 2),
    'transaccion_id', v_transaccion_id
  );
end;
$$;

-- Solo el backend con service role puede confirmar dinero real.
revoke execute on function public.procesar_pago_culqi(uuid, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.procesar_pago_culqi(uuid, numeric, text, text)
  to service_role;

-- ============================================================
-- Fin. La función atómica de "pagar con saldo" se agrega en la Fase 4.
-- ============================================================
