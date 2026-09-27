-- =====================================================================
--  Mesa · gasto real medido
--  Supabase → SQL Editor → pegar → Run
-- =====================================================================

alter table public.objetivos
  add column if not exists metodo text not null default 'formula'
    check (metodo in ('formula', 'medido')),
  add column if not exists gasto_estimado int;

comment on column public.objetivos.metodo is
  'formula = Mifflin-St Jeor; medido = deducido de lo comido y el peso real';
