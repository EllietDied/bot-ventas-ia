-- IA InkaShop · Migración de seguridad para producción
-- Fecha: 2026-07-29
-- Idempotente: puede ejecutarse más de una vez sin duplicar movimientos ni políticas.

begin;

-- ---------------------------------------------------------------------------
-- 1) Columnas históricas y de envío requeridas por los pedidos.
-- ---------------------------------------------------------------------------
alter table public.pedidos
  add column if not exists comprador_nombre  text,
  add column if not exists envio_receptor     text,
  add column if not exists envio_telefono     text,
  add column if not exists envio_direccion    text,
  add column if not exists envio_referencia   text,
  add column if not exists envio_dni          text,
  add column if not exists envio_departamento text,
  add column if not exists envio_provincia    text,
  add column if not exists envio_distrito     text,
  add column if not exists envio_correo       text,
  add column if not exists envio_empresa      text;

-- ---------------------------------------------------------------------------
-- 2) Culqi: registrar la transacción y sumar el saldo en una sola transacción.
-- ---------------------------------------------------------------------------
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

revoke execute on function public.procesar_pago_culqi(uuid, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.procesar_pago_culqi(uuid, numeric, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 3) Crear pedidos con usuario, nombres, precios y totales obtenidos de la base.
-- ---------------------------------------------------------------------------
create or replace function public.crear_pedido(
  items jsonb,
  metodo text,
  banco text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario         uuid := auth.uid();
  v_subtotal        numeric := 0;
  v_descuento       numeric := 0;
  v_total           numeric := 0;
  v_item            jsonb;
  v_precio          numeric;
  v_stock           integer;
  v_cantidad        integer;
  v_prod_id         bigint;
  v_pedido_id       bigint;
  v_correo          text;
  v_comprador       text;
  v_nombre_producto text;
  v_metodo          text := lower(coalesce(metodo, 'tarjeta'));
begin
  if v_usuario is null then
    return jsonb_build_object('ok', false, 'error', 'Necesitas iniciar sesión.');
  end if;

  if jsonb_typeof(items) is distinct from 'array' then
    return jsonb_build_object('ok', false, 'error', 'El carrito debe ser una lista de productos.');
  end if;
  if jsonb_array_length(items) < 1 or jsonb_array_length(items) > 50 then
    return jsonb_build_object('ok', false, 'error', 'El carrito debe tener entre 1 y 50 productos.');
  end if;

  if v_metodo not in (
    'tarjeta', 'yape', 'plin', 'transferencia',
    'pagoefectivo', 'paypal', 'mercadopago'
  ) then
    return jsonb_build_object('ok', false, 'error', 'Método de pago inválido.');
  end if;

  for v_item in select * from jsonb_array_elements(items) loop
    if coalesce(v_item->>'producto_id', '') !~ '^[1-9][0-9]*$'
       or coalesce(v_item->>'cantidad', '') !~ '^[1-9][0-9]*$' then
      return jsonb_build_object('ok', false, 'error', 'Producto o cantidad inválidos.');
    end if;

    v_prod_id := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::integer;
    if v_cantidad > 100 then
      return jsonb_build_object('ok', false, 'error', 'Cantidad fuera de rango.');
    end if;

    select precio, stock, nombre
      into v_precio, v_stock, v_nombre_producto
      from public.productos
     where id = v_prod_id;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'Un producto ya no existe.');
    end if;
    if v_stock < v_cantidad then
      return jsonb_build_object('ok', false, 'error', 'Sin stock suficiente.');
    end if;

    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  if v_subtotal >= 3000 then
    v_descuento := round(v_subtotal * 0.10, 2);
  elsif v_subtotal >= 1000 then
    v_descuento := round(v_subtotal * 0.05, 2);
  end if;
  v_total := v_subtotal - v_descuento;

  select correo,
         nullif(trim(coalesce(nombre, '') || ' ' || coalesce(apellido, '')), '')
    into v_correo, v_comprador
    from public.perfiles
   where id = v_usuario;

  insert into public.pedidos (
    id_comprador, correo_comprador, comprador_nombre,
    subtotal, descuento, total, metodo_pago, banco, estado, estado_pago
  )
  values (
    v_usuario, v_correo, v_comprador,
    v_subtotal, v_descuento, v_total, v_metodo,
    case when v_metodo = 'transferencia' then left(banco, 60) else null end,
    'pendiente', 'aprobado'
  )
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(items) loop
    v_prod_id := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::integer;

    select precio, nombre
      into v_precio, v_nombre_producto
      from public.productos
     where id = v_prod_id;

    insert into public.detalle_pedido (
      pedido_id, producto_id, nombre, cantidad, precio
    )
    values (
      v_pedido_id, v_prod_id, v_nombre_producto, v_cantidad, v_precio
    );
  end loop;

  return jsonb_build_object(
    'ok', true, 'pedido_id', v_pedido_id,
    'subtotal', v_subtotal, 'descuento', v_descuento, 'total', v_total
  );
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return jsonb_build_object('ok', false, 'error', 'Producto o cantidad inválidos.');
end;
$$;

grant execute on function public.crear_pedido(jsonb, text, text) to authenticated;
revoke execute on function public.crear_pedido(jsonb, text, text) from anon, public;

-- ---------------------------------------------------------------------------
-- 4) Pagar con saldo: bloqueo de billetera, precios reales y descuento coherente.
-- ---------------------------------------------------------------------------
create or replace function public.pagar_con_saldo(items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario         uuid := auth.uid();
  v_subtotal        numeric := 0;
  v_descuento       numeric := 0;
  v_total           numeric := 0;
  v_saldo           numeric;
  v_item            jsonb;
  v_precio          numeric;
  v_stock           integer;
  v_cantidad        integer;
  v_prod_id         bigint;
  v_pedido_id       bigint;
  v_correo          text;
  v_comprador       text;
  v_nombre_producto text;
begin
  if v_usuario is null then
    return jsonb_build_object('ok', false, 'error', 'Necesitas iniciar sesión.');
  end if;

  if jsonb_typeof(items) is distinct from 'array' then
    return jsonb_build_object('ok', false, 'error', 'El carrito debe ser una lista de productos.');
  end if;
  if jsonb_array_length(items) < 1 or jsonb_array_length(items) > 50 then
    return jsonb_build_object('ok', false, 'error', 'El carrito debe tener entre 1 y 50 productos.');
  end if;

  for v_item in select * from jsonb_array_elements(items) loop
    if coalesce(v_item->>'producto_id', '') !~ '^[1-9][0-9]*$'
       or coalesce(v_item->>'cantidad', '') !~ '^[1-9][0-9]*$' then
      return jsonb_build_object('ok', false, 'error', 'Producto o cantidad inválidos.');
    end if;

    v_prod_id := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::integer;
    if v_cantidad > 100 then
      return jsonb_build_object('ok', false, 'error', 'Cantidad fuera de rango.');
    end if;

    select precio, stock, nombre
      into v_precio, v_stock, v_nombre_producto
      from public.productos
     where id = v_prod_id
     for update;

    if not found then
      return jsonb_build_object('ok', false, 'error', 'Un producto ya no existe.');
    end if;
    if v_stock < v_cantidad then
      return jsonb_build_object('ok', false, 'error', 'Sin stock suficiente.');
    end if;

    v_subtotal := v_subtotal + v_precio * v_cantidad;
  end loop;

  if v_subtotal >= 3000 then
    v_descuento := round(v_subtotal * 0.10, 2);
  elsif v_subtotal >= 1000 then
    v_descuento := round(v_subtotal * 0.05, 2);
  end if;
  v_total := v_subtotal - v_descuento;

  select saldo
    into v_saldo
    from public.billeteras
   where id = v_usuario
   for update;

  if not found or v_saldo < v_total then
    return jsonb_build_object(
      'ok', false, 'error', 'Saldo insuficiente.',
      'total', v_total, 'saldo', coalesce(v_saldo, 0)
    );
  end if;

  update public.billeteras
     set saldo = saldo - v_total,
         actualizado_en = now()
   where id = v_usuario;

  select correo,
         nullif(trim(coalesce(nombre, '') || ' ' || coalesce(apellido, '')), '')
    into v_correo, v_comprador
    from public.perfiles
   where id = v_usuario;

  insert into public.pedidos (
    id_comprador, correo_comprador, comprador_nombre,
    subtotal, descuento, total, metodo_pago, estado, estado_pago
  )
  values (
    v_usuario, v_correo, v_comprador,
    v_subtotal, v_descuento, v_total, 'billetera', 'pendiente', 'aprobado'
  )
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(items) loop
    v_prod_id := (v_item->>'producto_id')::bigint;
    v_cantidad := (v_item->>'cantidad')::integer;

    select precio, nombre
      into v_precio, v_nombre_producto
      from public.productos
     where id = v_prod_id;

    insert into public.detalle_pedido (
      pedido_id, producto_id, nombre, cantidad, precio
    )
    values (
      v_pedido_id, v_prod_id, v_nombre_producto, v_cantidad, v_precio
    );

    update public.productos
       set stock = stock - v_cantidad
     where id = v_prod_id;
  end loop;

  insert into public.transacciones (
    usuario_id, tipo, monto, estado, metodo, pedido_id
  )
  values (
    v_usuario, 'compra_saldo', v_total, 'aprobado', 'saldo', v_pedido_id
  );

  return jsonb_build_object(
    'ok', true, 'pedido_id', v_pedido_id,
    'subtotal', v_subtotal, 'descuento', v_descuento, 'total', v_total
  );
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return jsonb_build_object('ok', false, 'error', 'Producto o cantidad inválidos.');
end;
$$;

grant execute on function public.pagar_con_saldo(jsonb) to authenticated;
revoke execute on function public.pagar_con_saldo(jsonb) from anon, public;

-- Nadie crea pedidos o detalles directamente: debe usar una función segura.
drop policy if exists "pedidos - crear" on public.pedidos;
drop policy if exists "detalle - crear" on public.detalle_pedido;
revoke insert on public.pedidos, public.detalle_pedido from authenticated;

-- ---------------------------------------------------------------------------
-- 5) Productos y fotos: solo vendedores activos y propietarios.
-- ---------------------------------------------------------------------------
drop policy if exists "productos - crear" on public.productos;
drop policy if exists "productos - editar" on public.productos;
drop policy if exists "productos - borrar" on public.productos;

create policy "productos - crear" on public.productos
  for insert to authenticated
  with check (
    (select auth.uid()) = id_vendedor
    and exists (
      select 1 from public.perfiles
       where id = (select auth.uid())
         and rol = 'vendedor'
         and estado = 'activo'
    )
  );

create policy "productos - editar" on public.productos
  for update to authenticated
  using (
    (select auth.uid()) = id_vendedor
    and exists (
      select 1 from public.perfiles
       where id = (select auth.uid())
         and rol = 'vendedor'
         and estado = 'activo'
    )
  )
  with check (
    (select auth.uid()) = id_vendedor
    and exists (
      select 1 from public.perfiles
       where id = (select auth.uid())
         and rol = 'vendedor'
         and estado = 'activo'
    )
  );

create policy "productos - borrar" on public.productos
  for delete to authenticated
  using (
    (select auth.uid()) = id_vendedor
    and exists (
      select 1 from public.perfiles
       where id = (select auth.uid())
         and rol = 'vendedor'
         and estado = 'activo'
    )
  );

drop policy if exists "fotos - leer" on storage.objects;
drop policy if exists "fotos - subir" on storage.objects;
drop policy if exists "fotos - editar" on storage.objects;
drop policy if exists "fotos - borrar" on storage.objects;
drop policy if exists "fotos - editar propias" on storage.objects;
drop policy if exists "fotos - borrar propias" on storage.objects;

create policy "fotos - subir" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'productos'
    and exists (
      select 1 from public.perfiles
       where id = (select auth.uid())
         and rol = 'vendedor'
         and estado = 'activo'
    )
  );

create policy "fotos - editar propias" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'productos'
    and owner = (select auth.uid())
  )
  with check (
    bucket_id = 'productos'
    and owner = (select auth.uid())
  );

create policy "fotos - borrar propias" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'productos'
    and owner = (select auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 6) Perfiles y pedidos: impedir escalada de rol y cambios sensibles.
-- ---------------------------------------------------------------------------
create or replace function public.preservar_rol_estado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.rol := old.rol;
    new.estado := old.estado;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_preservar_rol_estado on public.perfiles;
create trigger tr_preservar_rol_estado
  before update on public.perfiles
  for each row execute function public.preservar_rol_estado();

revoke execute on function public.preservar_rol_estado()
  from public, anon, authenticated;

drop policy if exists "perfil propio - editar" on public.perfiles;
create policy "perfil propio - editar" on public.perfiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.preservar_campos_pedido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.id_comprador     := old.id_comprador;
    new.correo_comprador := old.correo_comprador;
    new.comprador_nombre := old.comprador_nombre;
    new.subtotal         := old.subtotal;
    new.descuento        := old.descuento;
    new.total            := old.total;
    new.metodo_pago      := old.metodo_pago;
    new.banco            := old.banco;
    new.estado_pago      := old.estado_pago;
    new.creado_en        := old.creado_en;

    if auth.uid() = old.id_comprador then
      -- El comprador solo puede completar/corregir sus datos de envío.
      new.estado := old.estado;
    else
      -- El vendedor solo puede atender el pedido; no altera datos del comprador.
      new.envio_receptor     := old.envio_receptor;
      new.envio_telefono     := old.envio_telefono;
      new.envio_direccion    := old.envio_direccion;
      new.envio_referencia   := old.envio_referencia;
      new.envio_dni          := old.envio_dni;
      new.envio_departamento := old.envio_departamento;
      new.envio_provincia    := old.envio_provincia;
      new.envio_distrito     := old.envio_distrito;
      new.envio_correo       := old.envio_correo;
      new.envio_empresa      := old.envio_empresa;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_preservar_importes_pedido on public.pedidos;
drop trigger if exists tr_preservar_campos_pedido on public.pedidos;
create trigger tr_preservar_campos_pedido
  before update on public.pedidos
  for each row execute function public.preservar_campos_pedido();

revoke execute on function public.preservar_campos_pedido()
  from public, anon, authenticated;

drop policy if exists "pedidos - envio comprador" on public.pedidos;
create policy "pedidos - envio comprador" on public.pedidos
  for update to authenticated
  using ((select auth.uid()) = id_comprador)
  with check ((select auth.uid()) = id_comprador);

-- ---------------------------------------------------------------------------
-- 7) Hallazgos heredados del Security Advisor.
-- ---------------------------------------------------------------------------
-- La aplicación no usa esta vista; exponía datos con los permisos de su creador.
drop view if exists public.perfiles_publicos;

-- La función ya referencia public.direcciones de forma explícita.
alter function public.limite_direcciones() set search_path = '';

-- El Libro debe aceptar reclamos anónimos, pero no filas vacías, estados falsos
-- ni referencias a la identidad de otro usuario.
drop policy if exists "reclamaciones - crear" on public.reclamaciones;
create policy "reclamaciones - crear" on public.reclamaciones
  for insert to anon, authenticated
  with check (
    length(trim(codigo)) between 6 and 40
    and tipo in ('reclamo', 'queja')
    and length(trim(consumidor_nombre)) between 2 and 160
    and length(trim(detalle)) between 10 and 5000
    and estado = 'pendiente'
    and (usuario_id is null or usuario_id = (select auth.uid()))
  );

commit;
