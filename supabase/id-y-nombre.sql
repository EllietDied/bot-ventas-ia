-- ============================================================
-- IA InkaShop · ID único por rol (BYR/SLR) + nombre del comprador en los pedidos
-- Cómo usar: Supabase → SQL Editor → pega todo → Run. (Seguro de re-ejecutar.)
-- ============================================================

-- ------------------------------------------------------------
-- 1) NÚMERO único para cada perfil (base del código BYR-XXX / SLR-XXX)
-- ------------------------------------------------------------
create sequence if not exists public.perfiles_numero_seq;
alter table public.perfiles add column if not exists numero bigint;

-- A los perfiles que YA existen (sin número) les asignamos uno, por antigüedad.
update public.perfiles p
   set numero = nextval('public.perfiles_numero_seq')
 where p.numero is null;

-- Los perfiles NUEVOS reciben su número automáticamente al registrarse.
alter table public.perfiles alter column numero set default nextval('public.perfiles_numero_seq');

-- ------------------------------------------------------------
-- 2) NOMBRE del comprador guardado en cada pedido
-- ------------------------------------------------------------
alter table public.pedidos add column if not exists comprador_nombre text;

-- crear_pedido: ahora guarda también el NOMBRE del comprador (de su perfil).
create or replace function public.crear_pedido(items jsonb, metodo text, banco text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario   uuid := auth.uid();
  v_subtotal  numeric := 0;
  v_descuento numeric := 0;
  v_total     numeric := 0;
  v_item      jsonb;
  v_precio    numeric;
  v_stock     int;
  v_cantidad  int;
  v_prod_id   bigint;
  v_pedido_id bigint;
  v_correo    text;
  v_nombre    text;
begin
  if v_usuario is null then
    return jsonb_build_object('ok', false, 'error', 'Necesitas iniciar sesión.');
  end if;

  for v_item in select * from jsonb_array_elements(items) loop
    v_prod_id  := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::int;
    if v_cantidad is null or v_cantidad <= 0 then
      return jsonb_build_object('ok', false, 'error', 'Cantidad inválida.');
    end if;
    select precio, stock into v_precio, v_stock from public.productos where id = v_prod_id;
    if v_precio is null then
      return jsonb_build_object('ok', false, 'error', 'Un producto ya no existe.');
    end if;
    if v_stock < v_cantidad then
      return jsonb_build_object('ok', false, 'error', 'Sin stock suficiente.');
    end if;
    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  if v_subtotal <= 0 then
    return jsonb_build_object('ok', false, 'error', 'El carrito está vacío.');
  end if;

  if v_subtotal >= 3000 then v_descuento := round(v_subtotal * 0.10, 2);
  elsif v_subtotal >= 1000 then v_descuento := round(v_subtotal * 0.05, 2);
  else v_descuento := 0; end if;
  v_total := v_subtotal - v_descuento;

  -- Datos del comprador desde SU perfil (no del navegador).
  select correo, nullif(trim(coalesce(nombre, '') || ' ' || coalesce(apellido, '')), '')
    into v_correo, v_nombre
    from public.perfiles where id = v_usuario;

  insert into public.pedidos
    (id_comprador, correo_comprador, comprador_nombre, subtotal, descuento, total,
     metodo_pago, banco, estado, estado_pago)
  values
    (v_usuario, v_correo, v_nombre, v_subtotal, v_descuento, v_total,
     coalesce(metodo, 'tarjeta'), banco, 'pendiente', 'aprobado')
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(items) loop
    v_prod_id  := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::int;
    select precio into v_precio from public.productos where id = v_prod_id;
    insert into public.detalle_pedido (pedido_id, producto_id, nombre, cantidad, precio)
      values (v_pedido_id, v_prod_id, coalesce(v_item->>'nombre', ''), v_cantidad, v_precio);
  end loop;

  return jsonb_build_object('ok', true, 'pedido_id', v_pedido_id,
                            'subtotal', v_subtotal, 'descuento', v_descuento, 'total', v_total);
end;
$$;
grant execute on function public.crear_pedido(jsonb, text, text) to authenticated;
revoke execute on function public.crear_pedido(jsonb, text, text) from anon, public;

-- pagar_con_saldo: idéntica a la actual, pero también guarda el nombre del comprador.
create or replace function public.pagar_con_saldo(items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario   uuid := auth.uid();
  v_total     numeric := 0;
  v_saldo     numeric;
  v_item      jsonb;
  v_precio    numeric;
  v_stock     int;
  v_cantidad  int;
  v_prod_id   bigint;
  v_pedido_id bigint;
  v_correo    text;
  v_nombre    text;
begin
  if v_usuario is null then
    return jsonb_build_object('ok', false, 'error', 'Necesitas iniciar sesión.');
  end if;

  for v_item in select * from jsonb_array_elements(items) loop
    v_prod_id  := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::int;
    select precio, stock into v_precio, v_stock from public.productos where id = v_prod_id;
    if v_precio is null then
      return jsonb_build_object('ok', false, 'error', 'Un producto ya no existe.');
    end if;
    if v_stock < v_cantidad then
      return jsonb_build_object('ok', false, 'error', 'Sin stock suficiente.');
    end if;
    v_total := v_total + v_precio * v_cantidad;
  end loop;

  if v_total <= 0 then
    return jsonb_build_object('ok', false, 'error', 'El carrito está vacío.');
  end if;

  select saldo into v_saldo from public.billeteras where id = v_usuario;
  if coalesce(v_saldo, 0) < v_total then
    return jsonb_build_object('ok', false, 'error', 'Saldo insuficiente.',
                              'total', v_total, 'saldo', coalesce(v_saldo, 0));
  end if;

  update public.billeteras
     set saldo = saldo - v_total, actualizado_en = now()
   where id = v_usuario;

  select correo, nullif(trim(coalesce(nombre, '') || ' ' || coalesce(apellido, '')), '')
    into v_correo, v_nombre
    from public.perfiles where id = v_usuario;

  insert into public.pedidos
    (id_comprador, correo_comprador, comprador_nombre, subtotal, descuento, total,
     metodo_pago, estado, estado_pago)
  values
    (v_usuario, v_correo, v_nombre, v_total, 0, v_total, 'billetera', 'pendiente', 'aprobado')
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(items) loop
    v_prod_id  := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::int;
    select precio into v_precio from public.productos where id = v_prod_id;
    insert into public.detalle_pedido (pedido_id, producto_id, nombre, cantidad, precio)
      values (v_pedido_id, v_prod_id, coalesce(v_item->>'nombre', ''), v_cantidad, v_precio);
    update public.productos set stock = stock - v_cantidad where id = v_prod_id;
  end loop;

  insert into public.transacciones (usuario_id, tipo, monto, estado, metodo, pedido_id)
    values (v_usuario, 'compra_saldo', v_total, 'aprobado', 'saldo', v_pedido_id);

  return jsonb_build_object('ok', true, 'pedido_id', v_pedido_id, 'total', v_total);
end;
$$;
grant execute on function public.pagar_con_saldo(jsonb) to authenticated;
revoke execute on function public.pagar_con_saldo(jsonb) from anon, public;

-- ============================================================
-- Fin. Los perfiles tienen "numero" (para BYR/SLR) y los pedidos nuevos guardan
-- el nombre del comprador. Los pedidos viejos no lo tienen (se hicieron antes).
-- ============================================================
