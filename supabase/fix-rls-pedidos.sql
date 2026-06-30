-- ============================================================
-- IA InkaShop · CORRIGE la recursión infinita del RLS (error 42P17)
-- en pedidos / detalle_pedido.
-- Cómo usar: Supabase → SQL Editor → pega todo → Run. (Seguro de re-ejecutar.)
--
-- CAUSA: la policy de `pedidos` consultaba `detalle_pedido`, y la de
-- `detalle_pedido` consultaba `pedidos` → círculo infinito. Con la service role
-- no se veía (omite RLS); con el token del usuario (RLS activo), Postgres aborta
-- con "infinite recursion detected in policy".
--
-- SOLUCIÓN: funciones SECURITY DEFINER que hacen el chequeo SIN disparar de nuevo
-- el RLS de esas tablas, rompiendo el círculo.
-- ============================================================

-- ¿El usuario actual es vendedor de algún producto de este pedido?
create or replace function public.es_vendedor_del_pedido(p_pedido bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.detalle_pedido d
    join public.productos pr on pr.id = d.producto_id
    where d.pedido_id = p_pedido and pr.id_vendedor = auth.uid()
  );
$$;
revoke execute on function public.es_vendedor_del_pedido(bigint) from public, anon;
grant  execute on function public.es_vendedor_del_pedido(bigint) to authenticated;

-- ¿El usuario puede VER este pedido? (es su comprador, o vendedor de sus productos)
create or replace function public.puede_ver_pedido(p_pedido bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
           select 1 from public.pedidos o
           where o.id = p_pedido and o.id_comprador = auth.uid()
         )
      or public.es_vendedor_del_pedido(p_pedido);
$$;
revoke execute on function public.puede_ver_pedido(bigint) from public, anon;
grant  execute on function public.puede_ver_pedido(bigint) to authenticated;

-- ---------- Reescribir las policies SIN referencias circulares ----------

-- PEDIDOS: leer (comprador propio, o vendedor de sus productos vía función)
drop policy if exists "pedidos - leer" on public.pedidos;
create policy "pedidos - leer" on public.pedidos for select using (
  auth.uid() = id_comprador or public.es_vendedor_del_pedido(id)
);

-- PEDIDOS: atender (solo el vendedor de los productos del pedido)
drop policy if exists "pedidos - atender" on public.pedidos;
create policy "pedidos - atender" on public.pedidos for update using (
  public.es_vendedor_del_pedido(id)
);

-- DETALLE: leer (según el acceso al pedido, vía función)
drop policy if exists "detalle - leer" on public.detalle_pedido;
create policy "detalle - leer" on public.detalle_pedido for select using (
  public.puede_ver_pedido(pedido_id)
);

-- ("pedidos - crear" y "detalle - crear" se quedan igual: no recursan,
--  solo comparan id_comprador = auth.uid().)

-- ============================================================
-- Fin. Ahora leer pedidos (app y API REST) ya no recursa.
-- ============================================================
