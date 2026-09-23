"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { hoyISO, type Momento } from "@/lib/objetivo";
import { calcularRacion } from "@/lib/racion";
import type { AlimentoDesglosado } from "@/lib/tipos";

interface RecetaCompleta {
  nombre: string;
  raciones_base: number;
  receta_ingredientes: {
    gramos: number;
    alimentos: {
      kcal_100: number;
      prot_100: number;
      carb_100: number;
      grasa_100: number;
    } | null;
  }[];
}

export async function guardarComida(
  momento: string,
  descripcion: string,
  alimentos: AlimentoDesglosado[]
) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const filas = alimentos.map((a) => ({
    miembro_id: user.id,
    fecha: hoyISO(),
    momento,
    descripcion: a.nombre,
    gramos: a.gramos,
    kcal: a.kcal,
    prot_g: a.prot_g,
    carb_g: a.carb_g,
    grasa_g: a.grasa_g,
    origen: "texto",
  }));

  const { error } = await supabase.from("registro_comidas").insert(filas);
  if (error) return { error: error.message };

  revalidatePath("/hoy");
  return { ok: true };
}

export async function borrarRegistro(id: string) {
  const supabase = await clienteServidor();
  const { error } = await supabase.from("registro_comidas").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/hoy");
  return { ok: true };
}

/**
 * Apunta tu ración de un plato del menú de hoy.
 *
 * El cálculo se rehace aquí, en el servidor, en vez de fiarnos de lo
 * que mande el navegador: si no, cualquiera podría apuntarse el plato
 * con las calorías que le diera la gana.
 */
export async function apuntarDelMenu(fecha: string, momento: Momento) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: puesto } = await supabase
    .from("menu_semanal")
    .select("receta_id")
    .eq("fecha", fecha)
    .eq("momento", momento)
    .maybeSingle();

  if (!puesto?.receta_id) return { error: "Hoy no hay nada puesto en el menú." };

  const { data: receta } = await supabase
    .from("recetas")
    .select("nombre, raciones_base, receta_ingredientes(gramos, alimentos(kcal_100, prot_100, carb_100, grasa_100))")
    .eq("id", puesto.receta_id)
    .maybeSingle<RecetaCompleta>();

  if (!receta) return { error: "No encuentro la receta." };

  const t = receta.receta_ingredientes.reduce(
    (acc, i) => {
      const g = Number(i.gramos);
      const a = i.alimentos;
      return {
        gramos: acc.gramos + g,
        kcal: acc.kcal + (g * Number(a?.kcal_100 ?? 0)) / 100,
        prot: acc.prot + (g * Number(a?.prot_100 ?? 0)) / 100,
        carb: acc.carb + (g * Number(a?.carb_100 ?? 0)) / 100,
        grasa: acc.grasa + (g * Number(a?.grasa_100 ?? 0)) / 100,
      };
    },
    { gramos: 0, kcal: 0, prot: 0, carb: 0, grasa: 0 }
  );

  const { data: objetivo } = await supabase
    .from("objetivos")
    .select("kcal_min, kcal_max")
    .eq("miembro_id", user.id)
    .order("desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!objetivo) return { error: "Antes hay que calcular tu objetivo." };

  const kcalDia = (objetivo.kcal_min + objetivo.kcal_max) / 2;
  const racion = calcularRacion(t.gramos, t.kcal, receta.raciones_base, kcalDia, momento);

  // Los macros se escalan igual que las calorías: misma proporción.
  const factor = t.kcal > 0 ? racion.kcal / t.kcal : 0;

  const { error } = await supabase.from("registro_comidas").insert({
    miembro_id: user.id,
    fecha,
    momento,
    receta_id: puesto.receta_id,
    descripcion: receta.nombre,
    gramos: racion.gramos,
    kcal: racion.kcal,
    prot_g: Math.round(t.prot * factor * 10) / 10,
    carb_g: Math.round(t.carb * factor * 10) / 10,
    grasa_g: Math.round(t.grasa * factor * 10) / 10,
    origen: "receta",
  });
  if (error) return { error: error.message };

  revalidatePath("/hoy");
  return { ok: true };
}

/** Repite una comida tal cual la apuntaste otro día. */
export async function repetir(habitual: AlimentoDesglosado & { momento: string }) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { error } = await supabase.from("registro_comidas").insert({
    miembro_id: user.id,
    fecha: hoyISO(),
    momento: habitual.momento,
    descripcion: habitual.nombre,
    gramos: habitual.gramos,
    kcal: habitual.kcal,
    prot_g: habitual.prot_g,
    carb_g: habitual.carb_g,
    grasa_g: habitual.grasa_g,
    origen: "manual",
  });
  if (error) return { error: error.message };

  revalidatePath("/hoy");
  return { ok: true };
}
