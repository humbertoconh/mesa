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

/**
 * Monta la semana con el recetario de la casa. Sin IA: con el tipo, las
 * etiquetas y las calorías de cada plato ya hay de sobra, y así es
 * instantáneo, gratis y no falla nunca.
 *
 * Sólo rellena los huecos vacíos: lo que ya esté puesto no se toca.
 */
export async function proponerSemana(dias: string[]) {
  const { supabase, hogarId } = await miHogar();
  if (!hogarId) return { error: "No estás en ninguna casa." };

  const { data: recetas } = await supabase
    .from("recetas")
    .select("id, nombre, tipo, etiquetas, raciones_base, receta_ingredientes(gramos, alimentos(kcal_100))")
    .eq("hogar_id", hogarId);

  if (!recetas || recetas.length < 3) {
    return { error: "Hacen falta al menos tres recetas para montar la semana." };
  }

  const { data: puestos } = await supabase
    .from("menu_semanal")
    .select("fecha, momento, receta_id")
    .eq("hogar_id", hogarId)
    .in("fecha", dias);

  const ocupados = new Map<string, string>();
  (puestos ?? []).forEach((p) => {
    if (p.receta_id) ocupados.set(`${p.fecha}|${p.momento}`, p.receta_id);
  });

  const catalogo = recetas.map((r) => {
    const fila = r as unknown as {
      id: string; nombre: string; tipo: string | null; etiquetas: string[] | null;
      raciones_base: number;
      receta_ingredientes: { gramos: number; alimentos: { kcal_100: number } | null }[];
    };
    const kcal = fila.receta_ingredientes.reduce(
      (s, i) => s + (Number(i.gramos) * Number(i.alimentos?.kcal_100 ?? 0)) / 100, 0
    );
    return {
      id: fila.id,
      tipo: fila.tipo ?? "",
      etiquetas: fila.etiquetas ?? [],
      kcal: Math.round(kcal / (fila.raciones_base || 1)),
    };
  });

  type Plato = (typeof catalogo)[number];

  // Ingrediente principal, para no repetir legumbre dos días seguidos.
  const PRINCIPALES = ["legumbre", "pescado", "marisco", "carne", "arroz",
                       "pasta", "verdura", "huevo"];
  const principal = (p: Plato) =>
    PRINCIPALES.find((x) => p.etiquetas.includes(x)) ?? "otro";

  /** Lo que pega en cada momento: la comida carga, la cena aligera. */
  function encaje(p: Plato, momento: "comida" | "cena") {
    let n = 0;
    if (momento === "comida") {
      if (["primero", "plato único"].includes(p.tipo)) n += 3;
      if (p.etiquetas.some((e) => ["arroz", "legumbre", "guiso", "pasta"].includes(e))) n += 2;
      if (p.kcal > 700) n += 1;
      if (p.tipo === "entrante") n -= 2;
    } else {
      if (["segundo", "entrante"].includes(p.tipo)) n += 3;
      if (p.etiquetas.some((e) => ["pescado", "verdura", "huevo", "sopa", "ensalada", "plancha"].includes(e))) n += 2;
      if (p.kcal < 500) n += 2;
      if (p.kcal > 800) n -= 3;
      if (p.etiquetas.includes("arroz")) n -= 1;
    }
    return n;
  }

  const usados = new Map<string, number>(); // cuántas veces va esta semana
  let anterior = "";                        // ingrediente del plato de antes
  const filas: { hogar_id: string; fecha: string; momento: string; receta_id: string }[] = [];

  for (const fecha of dias) {
    for (const momento of ["comida", "cena"] as const) {
      const clave = `${fecha}|${momento}`;
      if (ocupados.has(clave)) {
        anterior = principal(
          catalogo.find((c) => c.id === ocupados.get(clave)) ?? catalogo[0]
        );
        continue;
      }

      const elegido = [...catalogo]
        .map((p) => {
          let n = encaje(p, momento);
          n -= (usados.get(p.id) ?? 0) * 6;              // no repetir plato
          if (principal(p) === anterior) n -= 4;         // ni ingrediente seguido
          n += Math.random() * 1.5;                      // que no salga igual cada vez
          return { p, n };
        })
        .sort((a, b) => b.n - a.n)[0].p;

      usados.set(elegido.id, (usados.get(elegido.id) ?? 0) + 1);
      anterior = principal(elegido);
      filas.push({ hogar_id: hogarId, fecha, momento, receta_id: elegido.id });
    }
  }

  if (!filas.length) return { error: "La semana ya está completa." };

  const { error } = await supabase
    .from("menu_semanal")
    .upsert(filas, { onConflict: "hogar_id,fecha,momento" });
  if (error) return { error: error.message };

  revalidatePath("/menu");
  return { ok: true, total: filas.length };
}
