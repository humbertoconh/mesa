-- =====================================================================
--  Mesa · recetario compartido entre casas
--  Supabase → SQL Editor → pegar → Run
-- =====================================================================

alter table public.recetas
  add column if not exists publica        boolean not null default false,
  add column if not exists autor          text,
  add column if not exists etiquetas      text[] not null default '{}',
  add column if not exists veces_copiada  int not null default 0,
  add column if not exists origen_id      uuid references public.recetas(id) on delete set null;

create index if not exists idx_recetas_publicas
  on public.recetas(publica, veces_copiada desc) where publica = true;


-- =====================================================================
--  RLS: las recetas compartidas se VEN desde cualquier casa, pero
--  sólo se tocan desde la tuya.
-- =====================================================================

drop policy if exists p_recetas on public.recetas;
drop policy if exists p_recetas_ver on public.recetas;
drop policy if exists p_recetas_crear on public.recetas;
drop policy if exists p_recetas_editar on public.recetas;
drop policy if exists p_recetas_borrar on public.recetas;

create policy p_recetas_ver on public.recetas
  for select using (hogar_id = public.mi_hogar() or publica = true);

create policy p_recetas_crear on public.recetas
  for insert with check (hogar_id = public.mi_hogar());

create policy p_recetas_editar on public.recetas
  for update using (hogar_id = public.mi_hogar())
  with check (hogar_id = public.mi_hogar());

create policy p_recetas_borrar on public.recetas
  for delete using (hogar_id = public.mi_hogar());


-- =====================================================================
--  Copiar una receta compartida a tu casa.
--
--  Va con SECURITY DEFINER porque tiene que leer los ingredientes de
--  otra casa, que el RLS no deja ver directamente. Así la puerta se
--  abre sólo para esto y no para curiosear la tabla entera.
--
--  Se COPIA, no se enlaza: si el autor la borra o le cambia los
--  gramos, tu menú y tu lista de la compra no se mueven.
-- =====================================================================

create or replace function public.copiar_receta(p_receta_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hogar   uuid;
  v_origen  recetas%rowtype;
  v_nueva   uuid;
  v_ing     record;
  v_alim    uuid;
begin
  select hogar_id into v_hogar from miembros where id = auth.uid();
  if v_hogar is null then
    raise exception 'No perteneces a ninguna casa';
  end if;

  select * into v_origen from recetas
   where id = p_receta_id and (publica = true or hogar_id = v_hogar);
  if v_origen.id is null then
    raise exception 'Esa receta no está compartida';
  end if;

  if v_origen.hogar_id = v_hogar then
    raise exception 'Esa receta ya es de tu casa';
  end if;

  insert into recetas (hogar_id, nombre, descripcion, raciones_base, minutos,
                       pasos, foto_url, etiquetas, autor, origen_id, publica)
  values (v_hogar, v_origen.nombre, v_origen.descripcion, v_origen.raciones_base,
          v_origen.minutos, v_origen.pasos, v_origen.foto_url, v_origen.etiquetas,
          v_origen.autor, v_origen.id, false)
  returning id into v_nueva;

  for v_ing in
    select ri.gramos, ri.nota, ri.seccion, a.nombre, a.marca,
           a.kcal_100, a.prot_100, a.carb_100, a.grasa_100, a.fibra_100
      from receta_ingredientes ri
      join alimentos a on a.id = ri.alimento_id
     where ri.receta_id = v_origen.id
  loop
    insert into alimentos (hogar_id, nombre, marca, kcal_100, prot_100,
                           carb_100, grasa_100, fibra_100, fuente)
    values (v_hogar, v_ing.nombre, v_ing.marca, v_ing.kcal_100, v_ing.prot_100,
            v_ing.carb_100, v_ing.grasa_100, v_ing.fibra_100, 'manual')
    returning id into v_alim;

    insert into receta_ingredientes (receta_id, alimento_id, gramos, nota, seccion)
    values (v_nueva, v_alim, v_ing.gramos, v_ing.nota, v_ing.seccion);
  end loop;

  update recetas set veces_copiada = veces_copiada + 1 where id = v_origen.id;

  return v_nueva;
end;
$$;

revoke execute on function public.copiar_receta(uuid) from public, anon;
grant execute on function public.copiar_receta(uuid) to authenticated;


-- =====================================================================
--  Sacar a alguien de la casa. Sólo el admin, y a sí mismo no.
-- =====================================================================

create or replace function public.expulsar_miembro(p_miembro_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hogar uuid;
  v_rol   text;
begin
  select hogar_id, rol into v_hogar, v_rol from miembros where id = auth.uid();
  if v_rol <> 'admin' then
    raise exception 'Sólo el administrador puede hacer esto';
  end if;
  if p_miembro_id = auth.uid() then
    raise exception 'No puedes sacarte a ti mismo';
  end if;

  delete from miembros where id = p_miembro_id and hogar_id = v_hogar;
end;
$$;

revoke execute on function public.expulsar_miembro(uuid) from public, anon;
grant execute on function public.expulsar_miembro(uuid) to authenticated;
