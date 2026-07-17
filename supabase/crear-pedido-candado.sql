-- ============================================================
-- IA InkaShop · "Candado" de pedidos (auditoría) — correr DESPUÉS de crear-pedido.sql
-- y de comprobar que el checkout funciona.
--
-- QUÉ HACE: quita el permiso de crear pedidos "a mano" desde el navegador. A partir
-- de aquí, los pedidos SOLO se pueden crear con las funciones seguras del servidor
-- (crear_pedido y pagar_con_saldo), que calculan los precios reales. Así nadie puede
-- insertar por la "puerta trasera" un pedido con precios inventados.
--
-- Es seguro: las funciones seguras corren con permisos del dueño (SECURITY DEFINER),
-- así que NO se ven afectadas por este candado. Solo se bloquea el INSERT directo.
-- ============================================================

revoke insert on public.pedidos        from authenticated;
revoke insert on public.detalle_pedido from authenticated;

-- (Opcional, limpieza) Quitamos también las políticas de INSERT que ya no aplican,
-- para dejar claro que la creación directa está deshabilitada.
drop policy if exists "pedidos - crear" on public.pedidos;
drop policy if exists "detalle - crear" on public.detalle_pedido;

-- ============================================================
-- Fin. Los pedidos ahora solo nacen de crear_pedido() o pagar_con_saldo().
-- ============================================================
