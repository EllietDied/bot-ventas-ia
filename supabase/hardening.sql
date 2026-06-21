-- ============================================================
-- IA InkaShop · Endurecimiento de seguridad (Security Advisor)
-- Resuelve 1 error + 3 advertencias del Advisor de Supabase.
-- Cómo usar: Supabase → SQL Editor → pega todo → Run.
-- No borra datos: solo quita objetos/permisos que no se usan.
-- ============================================================

-- 1) ERROR "Security Definer View":
--    La vista perfiles_publicos NO se usa en la app (los nombres a mostrar
--    se guardan copiados en productos.vendedor_nombre, mensajes.de_nombre, etc.).
drop view if exists public.perfiles_publicos;

-- 2) ADVERTENCIAS "Public/Signed-In can execute SECURITY DEFINER":
--    La función del trigger sigue ejecutándose al registrarse un usuario,
--    pero ya NO se podrá invocar directamente desde la API.
revoke execute on function public.crear_perfil() from public, anon, authenticated;

-- 3) ADVERTENCIA "Public Bucket Allows Listing":
--    Quita el permiso que dejaba LISTAR los archivos del bucket de fotos.
--    Las imágenes públicas se siguen viendo por su URL pública (bucket public).
drop policy if exists "fotos - leer" on storage.objects;

-- Listo. Vuelve a Advisors → Security Advisor → Refresh: debería quedar en 0/0.
