"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";

async function miHogar() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data } = await supabase
    .from("miembros")
    .select("hogar_id")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, hogarId: data?.hogar_id as string | undefined };
}

export async function ponerPlato(fecha: string, momento: string, recetaId: string) {
  const { supabase, hogarId } = await miHogar();
  if (!hogarId) return { error: "No estás en ninguna casa." };

  const { error } = await supabase
    .from("menu_semanal")
    .upsert(
      { hogar_id: hogarId, fecha, momento, receta_id: recetaId },
      { onConflict: "hogar_id,fecha,momento" }
    );
  if (error) return { error: error.message };

  revalidatePath("/menu");
  return { ok: true };
}

export async function quitarPlato(fecha: string, momento: string) {
  const { supabase, hogarId } = await miHogar();
  if (!hogarId) return { error: "No estás en ninguna casa." };

  const { error } = await supabase
    .from("menu_semanal")
    .delete()
    .eq("hogar_id", hogarId)
    .eq("fecha", fecha)
    .eq("momento", momento);
  if (error) return { error: error.message };

  revalidatePath("/menu");
  return { ok: true };
}

/**
 * Suma los ingredientes de todos los platos de la semana y rehace la
 * lista de la compra.
 *
 * Lo que ya estaba marcado como comprado se respeta: si alguien va por
 * el súper con el móvil y otro regenera la lista, no se le borran las
 * marcas.
 */
export async function generarLista(lunes: string, dias: string[]) {
  const { supabase, hogarId } = await miHogar();
  if (!hogarId) return { error: "No estás en ninguna casa." };

  const { count } = await supabase
    .from("miembros")
    .select("id", { count: "exact", head: true })
    .eq("hogar_id", hogarId);
  const comensales = count ?? 1;

  const { data: platos } = await supabase
    .from("menu_semanal")
    .select("receta_id")
    .eq("hogar_id", hogarId)
    .in("fecha", dias)
    .not("receta_id", "is", null);

  if (!platos?.length) return { error: "No hay platos en el menú de esta semana." };

  const { data: ingredientes } = await supabase
    .from("receta_ingredientes")
    .select("gramos, seccion, receta_id, alimentos(nombre), recetas(raciones_base)")
    .in("receta_id", platos.map((p) => p.receta_id));

  // Un mismo ingrediente puede salir en varios platos: se suma.
  const suma = new Map<string, { cantidad: number; seccion: string }>();

  (ingredientes ?? []).forEach((i) => {
    const fila = i as unknown as {
      gramos: number;
      seccion: string;
      alimentos: { nombre: string } | null;
      recetas: { raciones_base: number } | null;
    };
    const nombre = fila.alimentos?.nombre;
    if (!nombre) return;
    const base = fila.recetas?.raciones_base || 4;
    const veces = platos.filter((p) => p.receta_id === (i as { receta_id: string }).receta_id).length;
    const cantidad = (Number(fila.gramos) * comensales * veces) / base;

    const previo = suma.get(nombre);
    suma.set(nombre, {
      cantidad: (previo?.cantidad ?? 0) + cantidad,
      seccion: previo?.seccion ?? fila.seccion,
    });
  });

  const { data: yaComprado } = await supabase
    .from("lista_compra")
    .select("producto")
    .eq("hogar_id", hogarId)
    .eq("semana", lunes)
    .eq("comprado", true);
  const marcados = new Set((yaComprado ?? []).map((p) => p.producto));

  await supabase
    .from("lista_compra")
    .delete()
    .eq("hogar_id", hogarId)
    .eq("semana", lunes)
    .eq("manual", false);

  const filas = [...suma.entries()].map(([producto, d]) => ({
    hogar_id: hogarId,
    producto,
    cantidad: Math.round(d.cantidad),
    unidad: "g",
    seccion: d.seccion,
    comprado: marcados.has(producto),
    semana: lunes,
  }));

  const { error } = await supabase.from("lista_compra").insert(filas);
  if (error) return { error: error.message };

  revalidatePath("/compra");
  return { ok: true, total: filas.length };
}
