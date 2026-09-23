-- =====================================================================
--  Mesa · super administrador y casas con aprobación
--  Supabase → SQL Editor → pegar → Run
-- =====================================================================

-- Quién manda. En tabla y no escrito en el código, para poder añadir
-- o quitar a alguien sin volver a desplegar la app.
create table if not exists public.superadmins (
  email     text primary key,
  creado_en timestamptz not null default now()
);

insert into public.superadmins (email)
values ('humbertoconh@gmail.com')
on conflict (email) do nothing;

alter table public.superadmins enable row level security;

create or replace function public.es_super()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from superadmins
     where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke execute on function public.es_super() from public, anon;
grant execute on function public.es_super() to authenticated;

drop policy if exists p_superadmins on public.superadmins;
create policy p_superadmins on public.superadmins
  for select using (public.es_super());


-- =====================================================================
--  Las casas nacen pendientes
-- =====================================================================

alter table public.hogares
  add column if not exists estado text not null default 'pendiente'
    check (estado in ('pendiente', 'activa', 'bloqueada'));

-- Las que ya existen se dan por buenas: son tuyas.
update public.hogares set estado = 'activa' where estado = 'pendiente';

drop policy if exists p_hogares on public.hogares;
drop policy if exists p_hogares_ver on public.hogares;
drop policy if exists p_hogares_mandar on public.hogares;

create policy p_hogares_ver on public.hogares
  for select using (id = public.mi_hogar() or public.es_super());

-- Crear, cambiar y borrar casas pasa por las funciones de abajo,
-- así que aquí sólo abrimos la puerta al super.
create policy p_hogares_mandar on public.hogares
  for all using (public.es_super()) with check (public.es_super());

-- El super necesita ver los miembros para saber cuánta gente hay en cada casa.
drop policy if exists p_miembros_ver on public.miembros;
create policy p_miembros_ver on public.miembros
  for select using (hogar_id = public.mi_hogar() or public.es_super());


-- =====================================================================
--  Crear casa: queda a la espera salvo que la cree el super
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
  v_letras text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if auth.uid() is null then
    raise exception 'Hay que estar identificado';
  end if;
  if exists (select 1 from miembros where id = auth.uid()) then
    raise exception 'Ya perteneces a un hogar';
  end if;

  loop
    v_codigo := '';
    for i in 1..6 loop
      v_codigo := v_codigo || substr(v_letras, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (select 1 from hogares where codigo = v_codigo);
  end loop;

  insert into hogares (nombre, codigo, estado)
  values (p_nombre, v_codigo, case when es_super() then 'activa' else 'pendiente' end)
    returning id into v_hogar;

  insert into miembros (id, hogar_id, nombre, rol)
    values (auth.uid(), v_hogar, p_mi_nombre, 'admin');

  return v_hogar;
end;
$$;


-- =====================================================================
--  Aprobar, bloquear y borrar casas. Sólo el super.
-- =====================================================================

create or replace function public.cambiar_estado_hogar(p_hogar_id uuid, p_estado text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not es_super() then
    raise exception 'No tienes permiso';
  end if;
  if p_estado not in ('pendiente', 'activa', 'bloqueada') then
    raise exception 'Estado no válido';
  end if;

  update hogares set estado = p_estado where id = p_hogar_id;
end;
$$;

create or replace function public.borrar_hogar(p_hogar_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not es_super() then
    raise exception 'No tienes permiso';
  end if;

  -- Se lleva por delante miembros, recetas, menú y lista de la compra
  -- por las claves foráneas en cascada. Las cuentas de acceso se quedan.
  delete from hogares where id = p_hogar_id;
end;
$$;

/** Lo que ve el panel: una fila por casa con su gente. */
create or replace function public.listar_hogares()
returns table (
  id uuid, nombre text, codigo text, estado text,
  creado_en timestamptz, miembros bigint, admin text, recetas bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select h.id, h.nombre, h.codigo, h.estado, h.creado_en,
         (select count(*) from miembros m where m.hogar_id = h.id),
         (select m.nombre from miembros m where m.hogar_id = h.id and m.rol = 'admin' limit 1),
         (select count(*) from recetas r where r.hogar_id = h.id)
    from hogares h
   where es_super()
   order by (h.estado = 'pendiente') desc, h.creado_en desc;
$$;

revoke execute on function public.cambiar_estado_hogar(uuid, text) from public, anon;
revoke execute on function public.borrar_hogar(uuid) from public, anon;
revoke execute on function public.listar_hogares() from public, anon;
grant execute on function public.cambiar_estado_hogar(uuid, text) to authenticated;
grant execute on function public.borrar_hogar(uuid) to authenticated;
grant execute on function public.listar_hogares() to authenticated;
