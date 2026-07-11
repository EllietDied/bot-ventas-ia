-- ============================================================
-- IA InkaShop · Correcciones de seguridad (auditoria)
-- Cierra dos hallazgos ALTOS: fotos sin dueno y escalada de rol.
-- Cómo usar: Supabase → SQL Editor → pega todo → Run. Seguro de re-ejecutar.
-- ============================================================

-- ------------------------------------------------------------
-- 1) STORAGE: que cada quien solo pueda EDITAR/BORRAR SUS propias fotos
--    (antes, cualquier usuario podia borrar/reemplazar las fotos de otro).
--    Al subir, Supabase fija automaticamente owner = quien sube.
-- ------------------------------------------------------------
drop policy if exists "fotos - editar" on storage.objects;
drop policy if exists "fotos - borrar" on storage.objects;

create policy "fotos - editar propias" on storage.objects
  for update to authenticated
  using (bucket_id = 'productos' and owner = auth.uid());

create policy "fotos - borrar propias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos' and owner = auth.uid());

-- (La política de subir se mantiene: un vendedor necesita subir. El owner queda
--  registrado, asi que ya nadie puede tocar fotos ajenas.)

-- ------------------------------------------------------------
-- 2) PERFILES: impedir que un usuario cambie su propio ROL o ESTADO
--    (antes, un comprador podia editarse a 'vendedor' = escalada de privilegios).
--    Un trigger conserva rol/estado en las ediciones hechas por un usuario.
--    Cuando actualiza el SERVIDOR (service role), auth.uid() es NULL y no aplica.
-- ------------------------------------------------------------
create or replace function public.preservar_rol_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    -- lo actualiza un usuario autenticado: no dejamos cambiar rol ni estado
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

-- Reforzamos la política de edicion del perfil con WITH CHECK (que no se pueda
-- reasignar la fila a otro id).
drop policy if exists "perfil propio - editar" on public.perfiles;
create policy "perfil propio - editar" on public.perfiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- Fin. (El endurecimiento del webhook de pagos va en el código: api/pago-webhook.ts
--  + variable CULQI_WEBHOOK_SECRET en Vercel y en la URL del webhook de Culqi.)
-- ============================================================
