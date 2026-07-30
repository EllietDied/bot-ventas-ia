-- ============================================================
-- IA InkaShop · Crear un pedido de forma SEGURA (en el SERVIDOR)
-- Cómo usar: Supabase → SQL Editor → pega todo → Run. (Seguro de re-ejecutar.)
--
-- POR QUÉ: antes el navegador creaba el pedido y podía mandar PRECIOS INVENTADOS
-- y marcarlo "pagado". Esta función corre DENTRO de la base: calcula el total con
-- los precios REALES del catálogo (ignora lo que diga el navegador) y valida el
-- stock. Es el mismo patrón seguro que pagar_con_saldo.
--
-- NOTA: no descuenta stock (los métodos simulados no deben tocar tu inventario real;
-- el pago con saldo, que es real, sí lo descuenta en su propia función).
-- ============================================================

create or replace function public.crear_pedido(items jsonb, metodo text, banco text default null)
returns jsonb
language plpgsql
security definer                 -- corre con permisos del dueño (crea el pedido saltando RLS)
set search_path = public
as $$
declare
  v_usuario   uuid := auth.uid();  -- el usuario sale del token de sesión, NO del navegador
  v_subtotal  numeric := 0;
  v_descuento numeric := 0;
  v_total     numeric := 0;
  v_item      jsonb;
  v_precio    numeric;
  v_nombre    text;
  v_stock     int;
  v_cantidad  int;
  v_prod_id   bigint;
  v_pedido_id bigint;
begin
  if v_usuario is null then
    return jsonb_build_object('ok', false, 'error', 'Necesitas iniciar sesión.');
  end if;

  -- 1) Subtotal con los PRECIOS REALES de la base + validar stock de cada producto.
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

  -- 2) Descuento (MISMA regla que el carrito: 10% > S/3000, 5% > S/1000).
  if v_subtotal >= 3000 then
    v_descuento := round(v_subtotal * 0.10, 2);
  elsif v_subtotal >= 1000 then
    v_descuento := round(v_subtotal * 0.05, 2);
  else
    v_descuento := 0;
  end if;
  v_total := v_subtotal - v_descuento;

  -- 3) Crear el pedido (con precios reales). estado_pago 'aprobado' mantiene la
  --    simulación de la demo; lo que ya NO se puede es inventar el precio/total.
  insert into public.pedidos
    (id_comprador, correo_comprador, subtotal, descuento, total, metodo_pago, banco, estado, estado_pago)
  values
    (v_usuario, (select correo from public.perfiles where id = v_usuario),
     v_subtotal, v_descuento, v_total, coalesce(metodo, 'tarjeta'), banco, 'pendiente', 'aprobado')
  returning id into v_pedido_id;

  -- 4) Detalle del pedido con los PRECIOS REALES.
  for v_item in select * from jsonb_array_elements(items) loop
    v_prod_id  := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::int;
    select precio, nombre into v_precio, v_nombre
      from public.productos where id = v_prod_id;
    insert into public.detalle_pedido (pedido_id, producto_id, nombre, cantidad, precio)
      values (v_pedido_id, v_prod_id, v_nombre, v_cantidad, v_precio);
  end loop;

  return jsonb_build_object('ok', true, 'pedido_id', v_pedido_id,
                            'subtotal', v_subtotal, 'descuento', v_descuento, 'total', v_total);
end;
$$;

-- Solo un usuario con sesión puede llamarla (y la función ya toma su id del token).
grant execute on function public.crear_pedido(jsonb, text, text) to authenticated;
revoke execute on function public.crear_pedido(jsonb, text, text) from anon, public;

-- ============================================================
-- Fin. (El "candado" que revoca la creación directa de pedidos va en un segundo
--  script, crear-pedido-candado.sql, que se corre DESPUÉS de probar el checkout.)
-- ============================================================
