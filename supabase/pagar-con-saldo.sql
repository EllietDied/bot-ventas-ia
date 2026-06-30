-- ============================================================
-- IA InkaShop · Pagar una compra con el SALDO de la billetera (en el SERVIDOR)
-- Cómo usar: Supabase → SQL Editor → pega todo → Run.
--
-- POR QUÉ EN EL SERVIDOR: el navegador se puede manipular. Esta función corre
-- DENTRO de la base de datos: calcula el total con los precios REALES, verifica el
-- saldo y descuenta, todo en una sola operación ATÓMICA (si algo falla, se revierte).
-- ============================================================

create or replace function public.pagar_con_saldo(items jsonb)
returns jsonb
language plpgsql
security definer            -- corre con permisos del dueño (puede escribir saltando RLS)
set search_path = public
as $$
declare
  v_usuario   uuid := auth.uid();   -- el usuario sale del token de sesión, NO del cliente
  v_total     numeric := 0;
  v_saldo     numeric;
  v_item      jsonb;
  v_precio    numeric;
  v_stock     int;
  v_cantidad  int;
  v_prod_id   bigint;
  v_pedido_id bigint;
begin
  -- Debe haber una sesión válida.
  if v_usuario is null then
    return jsonb_build_object('ok', false, 'error', 'Necesitas iniciar sesión.');
  end if;

  -- 1) Calcular el total con los PRECIOS REALES de la base (no los del navegador)
  --    y comprobar que haya stock suficiente de cada producto.
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

  -- 2) Comprobar que el saldo alcance.
  select saldo into v_saldo from public.billeteras where id = v_usuario;
  if coalesce(v_saldo, 0) < v_total then
    return jsonb_build_object('ok', false, 'error', 'Saldo insuficiente.',
                              'total', v_total, 'saldo', coalesce(v_saldo, 0));
  end if;

  -- 3) Descontar el saldo.
  update public.billeteras
     set saldo = saldo - v_total, actualizado_en = now()
   where id = v_usuario;

  -- 4) Crear el pedido.
  insert into public.pedidos
    (id_comprador, correo_comprador, subtotal, descuento, total, metodo_pago, estado, estado_pago)
  values
    (v_usuario, (select correo from public.perfiles where id = v_usuario),
     v_total, 0, v_total, 'billetera', 'pendiente', 'aprobado')
  returning id into v_pedido_id;

  -- 5) Detalle del pedido + descontar stock (con los precios reales).
  for v_item in select * from jsonb_array_elements(items) loop
    v_prod_id  := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::int;
    select precio into v_precio from public.productos where id = v_prod_id;
    insert into public.detalle_pedido (pedido_id, producto_id, nombre, cantidad, precio)
      values (v_pedido_id, v_prod_id, coalesce(v_item->>'nombre', ''), v_cantidad, v_precio);
    update public.productos set stock = stock - v_cantidad where id = v_prod_id;
  end loop;

  -- 6) Registrar el movimiento en la billetera.
  insert into public.transacciones (usuario_id, tipo, monto, estado, metodo, pedido_id)
    values (v_usuario, 'compra_saldo', v_total, 'aprobado', 'saldo', v_pedido_id);

  return jsonb_build_object('ok', true, 'pedido_id', v_pedido_id, 'total', v_total);
end;
$$;

-- Solo un usuario con sesión puede llamarla (y la función ya verifica que sea él mismo).
grant execute on function public.pagar_con_saldo(jsonb) to authenticated;
revoke execute on function public.pagar_con_saldo(jsonb) from anon, public;
