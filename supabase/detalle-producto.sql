-- ============================================================
-- IA InkaShop · Ficha de producto (detalle) — extra RA3
-- Agrega campos para la página de detalle: modelo, material, características y una
-- galería de fotos. Cómo usar: Supabase → SQL Editor → pega esto → Run.
-- Es seguro correrlo varias veces (usa "if not exists").
-- ============================================================

alter table public.productos add column if not exists modelo text;
alter table public.productos add column if not exists material text;
alter table public.productos add column if not exists caracteristicas text;
-- Galería: lista de URLs de las fotos del producto (la 1ª es la principal).
alter table public.productos add column if not exists imagenes jsonb not null default '[]'::jsonb;
