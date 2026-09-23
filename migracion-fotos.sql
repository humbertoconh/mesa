-- =====================================================================
--  Mesa · fotos de recetas
--  Supabase → SQL Editor → pegar → Run
-- =====================================================================

alter table public.recetas add column if not exists foto_url text;

-- Bucket público: son fotos de platos, no hay nada que proteger, y
-- así la imagen se ve con una etiqueta <img> normal sin firmar nada.
insert into storage.buckets (id, name, public)
values ('recetas', 'recetas', true)
on conflict (id) do update set public = true;

-- Subir, cambiar y borrar: sólo quien haya entrado con su cuenta.
drop policy if exists p_recetas_subir on storage.objects;
create policy p_recetas_subir on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recetas');

drop policy if exists p_recetas_cambiar on storage.objects;
create policy p_recetas_cambiar on storage.objects
  for update to authenticated
  using (bucket_id = 'recetas');

drop policy if exists p_recetas_borrar on storage.objects;
create policy p_recetas_borrar on storage.objects
  for delete to authenticated
  using (bucket_id = 'recetas');
