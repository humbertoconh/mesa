-- =====================================================================
--  Mesa · despensa
--  Lo que siempre hay en casa y no se compra cada semana.
--  Supabase → SQL Editor → pegar → Run
-- =====================================================================

create table if not exists public.despensa (
  hogar_id  uuid not null references public.hogares(id) on delete cascade,
  clave     text not null,          -- nombre normalizado, para comparar
  nombre    text not null,          -- como se escribe de verdad
  creado_en timestamptz not null default now(),
  primary key (hogar_id, clave)
);

alter table public.despensa enable row level security;

drop policy if exists p_despensa on public.despensa;
create policy p_despensa on public.despensa
  for all using (hogar_id = public.mi_hogar())
  with check (hogar_id = public.mi_hogar());

grant select, insert, update, delete on public.despensa to authenticated;

-- En la lista de la compra, los básicos se separan del resto.
alter table public.lista_compra
  add column if not exists basico boolean not null default false;
