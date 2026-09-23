-- =====================================================================
--  Mesa · clasificación de recetas
--  Supabase → SQL Editor → pegar → Run
-- =====================================================================

alter table public.recetas
  add column if not exists region     text,
  add column if not exists tipo       text,
  add column if not exists temporada  text,
  add column if not exists dificultad text;

-- Índices para que los filtros no se arrastren cuando haya cientos.
create index if not exists idx_recetas_region on public.recetas(hogar_id, region);
create index if not exists idx_recetas_tipo   on public.recetas(hogar_id, tipo);
create index if not exists idx_recetas_etiq   on public.recetas using gin (etiquetas);
