-- =====================================================================
--  MESA · esquema de base de datos
--  Supabase / PostgreSQL
--
--  Cómo usarlo:
--    Supabase → SQL Editor → pegar todo → Run
--  Es idempotente: puedes volver a ejecutarlo sin romper nada.
-- =====================================================================


-- =====================================================================
--  1. TABLAS COMPARTIDAS  (las ve todo el hogar)
-- =====================================================================

create table if not exists public.hogares (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  codigo      text not null unique,          -- código de invitación, 6 caracteres
  creado_en   timestamptz not null default now()
);

create table if not exists public.miembros (
  id          uuid primary key references auth.users(id) on delete cascade,
  hogar_id    uuid not null references public.hogares(id) on delete cascade,
  nombre      text not null,
  rol         text not null default 'miembro' check (rol in ('admin','miembro')),
  nacimiento  date,
  sexo        text check (sexo in ('h','m')),
  altura_cm   numeric(5,1),
  actividad   numeric(3,2) default 1.4,      -- factor de actividad (1.2 a 1.9)
  creado_en   timestamptz not null default now()
);
create index if not exists idx_miembros_hogar on public.miembros(hogar_id);

-- Alimentos. Los de Open Food Facts / BEDCA se cachean con hogar_id null
-- (visibles para todos). Los que cree una casa a mano llevan su hogar_id.
create table if not exists public.alimentos (
  id            uuid primary key default gen_random_uuid(),
  hogar_id      uuid references public.hogares(id) on delete cascade,
  nombre        text not null,
  marca         text,
  codigo_barras text,
  kcal_100      numeric(7,2) not null,
  prot_100      numeric(7,2) not null default 0,
  carb_100      numeric(7,2) not null default 0,
  grasa_100     numeric(7,2) not null default 0,
  fibra_100     numeric(7,2),
  fuente        text not null default 'manual'
                check (fuente in ('openfoodfacts','bedca','usda','ia','manual')),
  creado_en     timestamptz not null default now()
);
create unique index if not exists idx_alimentos_barras
  on public.alimentos(codigo_barras) where codigo_barras is not null;
create index if not exists idx_alimentos_nombre
  on public.alimentos using gin (to_tsvector('spanish', nombre));

create table if not exists public.recetas (
  id            uuid primary key default gen_random_uuid(),
  hogar_id      uuid not null references public.hogares(id) on delete cascade,
  nombre        text not null,
  descripcion   text,
  raciones_base int not null default 4,      -- para cuántos está escrita
  minutos       int,
  pasos         text[],
  creado_en     timestamptz not null default now()
);
create index if not exists idx_recetas_hogar on public.recetas(hogar_id);

create table if not exists public.receta_ingredientes (
  id          uuid primary key default gen_random_uuid(),
  receta_id   uuid not null references public.recetas(id) on delete cascade,
  alimento_id uuid not null references public.alimentos(id),
  gramos      numeric(8,2) not null,         -- para raciones_base
  nota        text,                          -- "picado", "al gusto"...
  seccion     text default 'despensa'        -- para agrupar la lista de la compra
              check (seccion in ('fruta_verdura','carniceria','pescaderia',
                                 'lacteos','panaderia','congelados','despensa','otros'))
);
create index if not exists idx_ingredientes_receta on public.receta_ingredientes(receta_id);

create table if not exists public.menu_semanal (
  id        uuid primary key default gen_random_uuid(),
  hogar_id  uuid not null references public.hogares(id) on delete cascade,
  fecha     date not null,
  momento   text not null check (momento in ('desayuno','almuerzo','comida','merienda','cena')),
  receta_id uuid references public.recetas(id) on delete set null,
  texto     text,                            -- si ese día se come algo suelto
  unique (hogar_id, fecha, momento)
);
create index if not exists idx_menu_hogar_fecha on public.menu_semanal(hogar_id, fecha);

create table if not exists public.lista_compra (
  id         uuid primary key default gen_random_uuid(),
  hogar_id   uuid not null references public.hogares(id) on delete cascade,
  producto   text not null,
  cantidad   numeric(8,2),
  unidad     text default 'g',
  seccion    text default 'despensa',
  comprado   boolean not null default false,
  manual     boolean not null default false, -- true si lo añadió alguien a mano
  semana     date,                           -- lunes de la semana a la que pertenece
  creado_en  timestamptz not null default now()
);
create index if not exists idx_compra_hogar on public.lista_compra(hogar_id, comprado);

-- Turnos de cocina (la pantalla del boceto; si sobra, borra esta tabla)
create table if not exists public.turnos_cocina (
  id         uuid primary key default gen_random_uuid(),
  hogar_id   uuid not null references public.hogares(id) on delete cascade,
  fecha      date not null,
  miembro_id uuid references public.miembros(id) on delete set null,
  unique (hogar_id, fecha)
);


-- =====================================================================
--  2. TABLAS PRIVADAS  (sólo las ve su dueño)
-- =====================================================================

create table if not exists public.objetivos (
  id           uuid primary key default gen_random_uuid(),
  miembro_id   uuid not null references public.miembros(id) on delete cascade,
  desde        date not null default current_date,
  meta         text not null default 'mantener'
               check (meta in ('perder','mantener','ganar')),
  kcal_min     int not null,
  kcal_max     int not null,
  prot_g       int not null,
  carb_g       int not null,
  grasa_g      int not null,
  automatico   boolean not null default true, -- se recalcula con el peso real
  creado_en    timestamptz not null default now()
);
create index if not exists idx_objetivos_miembro on public.objetivos(miembro_id, desde desc);

create table if not exists public.registro_comidas (
  id          uuid primary key default gen_random_uuid(),
  miembro_id  uuid not null references public.miembros(id) on delete cascade,
  fecha       date not null default current_date,
  momento     text not null check (momento in ('desayuno','almuerzo','comida','merienda','cena')),
  alimento_id uuid references public.alimentos(id),
  receta_id   uuid references public.recetas(id),
  descripcion text,                          -- lo que escribió o dictó
  gramos      numeric(8,2),
  kcal        numeric(8,2) not null,         -- congelado: si cambia el alimento, el histórico no se mueve
  prot_g      numeric(7,2) not null default 0,
  carb_g      numeric(7,2) not null default 0,
  grasa_g     numeric(7,2) not null default 0,
  origen      text not null default 'texto'
              check (origen in ('texto','foto','voz','barras','receta','manual')),
  foto_url    text,
  creado_en   timestamptz not null default now()
);
create index if not exists idx_registro_miembro_fecha
  on public.registro_comidas(miembro_id, fecha desc);

create table if not exists public.pesos (
  id         uuid primary key default gen_random_uuid(),
  miembro_id uuid not null references public.miembros(id) on delete cascade,
  fecha      date not null default current_date,
  kg         numeric(5,2) not null,
  cintura_cm numeric(5,1),
  pecho_cm   numeric(5,1),
  cadera_cm  numeric(5,1),
  unique (miembro_id, fecha)
);

create table if not exists public.agua (
  id         uuid primary key default gen_random_uuid(),
  miembro_id uuid not null references public.miembros(id) on delete cascade,
  fecha      date not null default current_date,
  vasos      int not null default 0,
  unique (miembro_id, fecha)
);


-- =====================================================================
--  3. FUNCIÓN AUXILIAR
--
--  Devuelve el hogar del usuario que está conectado.
--  Va con SECURITY DEFINER a propósito: si la política de 'miembros'
--  consultara la propia tabla 'miembros', Postgres entra en bucle.
--  Esto lo corta.
-- =====================================================================

create or replace function public.mi_hogar()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hogar_id from public.miembros where id = auth.uid();
$$;


-- =====================================================================
--  4. RLS · row level security
--
--  Sin esto, cualquiera con la clave pública lee toda la base.
--  Con esto, Postgres filtra por usuario en cada consulta.
-- =====================================================================

alter table public.hogares            enable row level security;
alter table public.miembros           enable row level security;
alter table public.alimentos          enable row level security;
alter table public.recetas            enable row level security;
alter table public.receta_ingredientes enable row level security;
alter table public.menu_semanal       enable row level security;
alter table public.lista_compra       enable row level security;
alter table public.turnos_cocina      enable row level security;
alter table public.objetivos          enable row level security;
alter table public.registro_comidas   enable row level security;
alter table public.pesos              enable row level security;
alter table public.agua               enable row level security;

-- ---- compartido: todo el que esté en el hogar ----

drop policy if exists p_hogares on public.hogares;
create policy p_hogares on public.hogares
  for all using (id = public.mi_hogar())
  with check (id = public.mi_hogar());

drop policy if exists p_miembros_ver on public.miembros;
create policy p_miembros_ver on public.miembros
  for select using (hogar_id = public.mi_hogar());

-- cada uno sólo edita su propia ficha
drop policy if exists p_miembros_editar on public.miembros;
create policy p_miembros_editar on public.miembros
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists p_alimentos on public.alimentos;
create policy p_alimentos on public.alimentos
  for all using (hogar_id is null or hogar_id = public.mi_hogar())
  with check (hogar_id is null or hogar_id = public.mi_hogar());

drop policy if exists p_recetas on public.recetas;
create policy p_recetas on public.recetas
  for all using (hogar_id = public.mi_hogar())
  with check (hogar_id = public.mi_hogar());

drop policy if exists p_ingredientes on public.receta_ingredientes;
create policy p_ingredientes on public.receta_ingredientes
  for all using (exists (
    select 1 from public.recetas r
    where r.id = receta_id and r.hogar_id = public.mi_hogar()))
  with check (exists (
    select 1 from public.recetas r
    where r.id = receta_id and r.hogar_id = public.mi_hogar()));

drop policy if exists p_menu on public.menu_semanal;
create policy p_menu on public.menu_semanal
  for all using (hogar_id = public.mi_hogar())
  with check (hogar_id = public.mi_hogar());

drop policy if exists p_compra on public.lista_compra;
create policy p_compra on public.lista_compra
  for all using (hogar_id = public.mi_hogar())
  with check (hogar_id = public.mi_hogar());

drop policy if exists p_turnos on public.turnos_cocina;
create policy p_turnos on public.turnos_cocina
  for all using (hogar_id = public.mi_hogar())
  with check (hogar_id = public.mi_hogar());

-- ---- privado: sólo su dueño, aunque sean de la misma casa ----

drop policy if exists p_objetivos on public.objetivos;
create policy p_objetivos on public.objetivos
  for all using (miembro_id = auth.uid()) with check (miembro_id = auth.uid());

drop policy if exists p_registro on public.registro_comidas;
create policy p_registro on public.registro_comidas
  for all using (miembro_id = auth.uid()) with check (miembro_id = auth.uid());

drop policy if exists p_pesos on public.pesos;
create policy p_pesos on public.pesos
  for all using (miembro_id = auth.uid()) with check (miembro_id = auth.uid());

drop policy if exists p_agua on public.agua;
create policy p_agua on public.agua
  for all using (miembro_id = auth.uid()) with check (miembro_id = auth.uid());


-- =====================================================================
--  5. ALTA DE HOGAR Y ENTRADA POR CÓDIGO
--
--  Van con SECURITY DEFINER porque el usuario todavía no pertenece
--  a ningún hogar cuando las llama: las políticas de arriba le
--  cerrarían la puerta.
-- =====================================================================

create or replace function public.crear_hogar(p_nombre text, p_mi_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hogar  uuid;
  v_codigo text;
begin
  if auth.uid() is null then
    raise exception 'Hay que estar identificado';
  end if;
  if exists (select 1 from miembros where id = auth.uid()) then
    raise exception 'Ya perteneces a un hogar';
  end if;

  -- código de 6 caracteres sin letras que se confundan (I, O, 0, 1)
  loop
    v_codigo := upper(substr(translate(encode(gen_random_bytes(8),'base64'),
                                       '+/=IO01lo', 'ABCDEFGHJ'), 1, 6));
    exit when not exists (select 1 from hogares where codigo = v_codigo);
  end loop;

  insert into hogares (nombre, codigo) values (p_nombre, v_codigo)
    returning id into v_hogar;

  insert into miembros (id, hogar_id, nombre, rol)
    values (auth.uid(), v_hogar, p_mi_nombre, 'admin');

  return v_hogar;
end;
$$;

create or replace function public.unirse_a_hogar(p_codigo text, p_mi_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hogar uuid;
begin
  if auth.uid() is null then
    raise exception 'Hay que estar identificado';
  end if;
  if exists (select 1 from miembros where id = auth.uid()) then
    raise exception 'Ya perteneces a un hogar';
  end if;

  select id into v_hogar from hogares where codigo = upper(trim(p_codigo));
  if v_hogar is null then
    raise exception 'Ese código no existe';
  end if;

  insert into miembros (id, hogar_id, nombre) values (auth.uid(), v_hogar, p_mi_nombre);
  return v_hogar;
end;
$$;


-- =====================================================================
--  6. VISTA DEL DÍA
--
--  Lo que pinta la pantalla "Hoy" de una sola consulta.
-- =====================================================================

create or replace view public.resumen_dia
with (security_invoker = true)
as
select
  r.miembro_id,
  r.fecha,
  sum(r.kcal)::numeric(8,1)   as kcal,
  sum(r.prot_g)::numeric(7,1) as prot_g,
  sum(r.carb_g)::numeric(7,1) as carb_g,
  sum(r.grasa_g)::numeric(7,1) as grasa_g,
  count(*)                    as registros
from public.registro_comidas r
group by r.miembro_id, r.fecha;


-- =====================================================================
--  Fin. Siguiente paso: Storage → crear bucket privado "fotos-comidas".
-- =====================================================================
