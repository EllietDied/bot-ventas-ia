-- ============================================================
-- IA InkaShop · Migración: agregar el campo SEXO al perfil
-- Cómo usar: Supabase → SQL Editor → pega todo → Run.
-- Es seguro correrlo aunque ya exista (usa "if not exists" / "or replace").
-- Solo hace falta en modo Supabase; en modo local no se necesita.
-- ============================================================

-- 1) Nueva columna en perfiles (opcional, validada: masculino o femenino).
alter table public.perfiles
  add column if not exists sexo text check (sexo in ('masculino','femenino'));

-- 2) El trigger que crea el perfil al registrarse ahora copia también el sexo
--    (llega en el metadata del signUp del frontend).
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (
    id, correo, nombre, apellido, telefono, prefijo_telefonico, telefono_internacional, rol, sexo,
    pais_codigo, pais_nombre, tipo_documento, documento_numero, documento_display,
    documento_complemento, codigo_postal,
    nivel1_tipo, nivel1_codigo, nivel1_nombre,
    nivel2_tipo, nivel2_codigo, nivel2_nombre,
    nivel3_tipo, nivel3_codigo, nivel3_nombre, direccion
  )
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'nombre',''),
    coalesce(new.raw_user_meta_data->>'apellido',''),
    new.raw_user_meta_data->>'telefono',
    new.raw_user_meta_data->>'prefijo_telefonico',
    new.raw_user_meta_data->>'telefono_internacional',
    coalesce(new.raw_user_meta_data->>'rol','comprador'),
    nullif(new.raw_user_meta_data->>'sexo',''),
    new.raw_user_meta_data->>'pais_codigo',
    new.raw_user_meta_data->>'pais_nombre',
    new.raw_user_meta_data->>'tipo_documento',
    new.raw_user_meta_data->>'documento_numero',
    new.raw_user_meta_data->>'documento_display',
    new.raw_user_meta_data->>'documento_complemento',
    new.raw_user_meta_data->>'codigo_postal',
    new.raw_user_meta_data->>'nivel1_tipo', new.raw_user_meta_data->>'nivel1_codigo', new.raw_user_meta_data->>'nivel1_nombre',
    new.raw_user_meta_data->>'nivel2_tipo', new.raw_user_meta_data->>'nivel2_codigo', new.raw_user_meta_data->>'nivel2_nombre',
    new.raw_user_meta_data->>'nivel3_tipo', new.raw_user_meta_data->>'nivel3_codigo', new.raw_user_meta_data->>'nivel3_nombre',
    new.raw_user_meta_data->>'direccion'
  );
  return new;
end;
$$;

-- Igual que en el esquema base: nadie debe poder llamar la función desde la API.
revoke execute on function public.crear_perfil() from public, anon, authenticated;
