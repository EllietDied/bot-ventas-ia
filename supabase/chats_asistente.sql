-- ============================================================
-- IA InkaShop · Historial del asistente sincronizado (extra RA3)
-- Guarda la conversación del chat por usuario y tipo de chat, para que se
-- sincronice entre dispositivos. Cómo usar: Supabase → SQL Editor → pega → Run.
-- ============================================================

create table if not exists public.chats_asistente (
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  rol text not null,                         -- tipo de chat: 'comprador' | 'vendedor'
  mensajes jsonb not null default '[]'::jsonb,
  actualizado_en timestamptz not null default now(),
  primary key (usuario_id, rol)
);

alter table public.chats_asistente enable row level security;
grant select, insert, update, delete on public.chats_asistente to authenticated;

-- Cada quien solo accede a su propio historial.
create policy "chat propio" on public.chats_asistente
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);
