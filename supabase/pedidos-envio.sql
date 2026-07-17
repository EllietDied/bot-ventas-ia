-- ============================================================
-- IA InkaShop · Permitir guardar la DIRECCIÓN DE ENVÍO en el pedido
-- Cómo usar: Supabase → SQL Editor → pega todo → Run. (Seguro de re-ejecutar.)
--
-- PROBLEMA: al pagar, el comprador intenta guardar su dirección de envío en el
-- pedido, pero las reglas (RLS) solo dejaban al VENDEDOR modificar pedidos, así que
-- el envío se rechazaba en silencio y los pedidos quedaban sin datos de envío.
--
-- SOLUCIÓN: dejamos que el comprador actualice SU pedido (para el envío), pero un
-- trigger BLINDA los importes y el estado del pago (no se pueden cambiar por UPDATE:
-- se fijan al crear el pedido con las funciones seguras). Así el comprador solo puede
-- tocar los datos de envío, nunca el total ni si está "pagado".
-- ============================================================

-- 1) El comprador puede actualizar SU propio pedido (para guardar el envío).
drop policy if exists "pedidos - envio comprador" on public.pedidos;
create policy "pedidos - envio comprador" on public.pedidos
  for update using (auth.uid() = id_comprador) with check (auth.uid() = id_comprador);

-- 2) Blindaje: nadie (comprador ni vendedor) puede cambiar los importes ni el pago
--    de un pedido por UPDATE. El servidor (service role) sí puede, por si el webhook
--    necesita confirmar un pago más adelante.
create or replace function public.preservar_importes_pedido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    -- Lo actualiza un USUARIO (no el servidor): conservamos los campos sensibles.
    new.id_comprador := old.id_comprador;
    new.subtotal     := old.subtotal;
    new.descuento    := old.descuento;
    new.total        := old.total;
    new.metodo_pago  := old.metodo_pago;
    new.estado_pago  := old.estado_pago;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_preservar_importes_pedido on public.pedidos;
create trigger tr_preservar_importes_pedido
  before update on public.pedidos
  for each row execute function public.preservar_importes_pedido();

-- ============================================================
-- Fin. Desde ahora, los pedidos NUEVOS guardan bien su dirección y empresa de envío.
-- (Los pedidos viejos, hechos antes de esto, no tienen esos datos guardados.)
-- ============================================================
