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

const MODELO = process.env.MODELO_IA ?? "claude-sonnet-5";

const INSTRUCCIONES = `Montas menús semanales para una casa española.

Te doy el recetario de la casa y los huecos que hay que rellenar.
Devuelve qué plato va en cada hueco.

Cómo repartir:
- No repitas plato en la misma semana salvo que no haya recetas de sobra.
- Alterna: si hay legumbre el lunes, que no la haya el martes.
- Reparte el pescado por la semana. Dos o tres veces está bien.
- Las cenas, más ligeras que las comidas. Los arroces y guisos, a la comida.
- Viernes, sábado y domingo admiten lo más elaborado o lo que más gusta.
- Si un hueco ya tiene plato puesto, no lo toques: está en la lista de
  ocupados para que no repitas eso mismo.

Responde SÓLO con el JSON, sin texto alrededor:
{"asignaciones":[{"fecha":"AAAA-MM-DD","momento":"comida","receta_id":"..."}]}`;

/**
 * Propone los platos de la semana a partir del recetario de la casa.
 * Sólo rellena los huecos vacíos: lo que ya esté puesto no se toca.
 */
export async function proponerSemana(dias: string[]) {
  const { supabase, hogarId } = await miHogar();
  if (!hogarId) return { error: "No estás en ninguna casa." };

  const { data: recetas } = await supabase
    .from("recetas")
    .select("id, nombre, raciones_base, receta_ingredientes(gramos, alimentos(nombre, kcal_100))")
    .eq("hogar_id", hogarId);

  if (!recetas?.length || recetas.length < 3) {
    return { error: "Hacen falta al menos tres recetas para montar la semana." };
  }

  const { data: puestos } = await supabase
    .from("menu_semanal")
    .select("fecha, momento, receta_id")
    .eq("hogar_id", hogarId)
    .in("fecha", dias);

  const ocupados = new Set(
    (puestos ?? [])
      .filter((p) => p.receta_id)
      .map((p) => `${p.fecha}|${p.momento}`)
  );

  const huecos: { fecha: string; momento: string }[] = [];
  dias.forEach((fecha) => {
    ["comida", "cena"].forEach((momento) => {
      if (!ocupados.has(`${fecha}|${momento}`)) huecos.push({ fecha, momento });
    });
  });

  if (!huecos.length) return { error: "La semana ya está completa." };

  const catalogo = recetas.map((r) => {
    const fila = r as unknown as {
      id: string;
      nombre: string;
      raciones_base: number;
      receta_ingredientes: { gramos: number; alimentos: { nombre: string; kcal_100: number } | null }[];
    };
    const kcal = fila.receta_ingredientes.reduce(
      (s, i) => s + (Number(i.gramos) * Number(i.alimentos?.kcal_100 ?? 0)) / 100,
      0
    );
    return {
      id: fila.id,
      nombre: fila.nombre,
      kcal_racion: Math.round(kcal / fila.raciones_base),
      // Los ingredientes ayudan a repartir pescado, legumbre y carne.
      ingredientes: fila.receta_ingredientes
        .map((i) => i.alimentos?.nombre)
        .filter(Boolean)
        .slice(0, 8),
    };
  });

  const ocupadosTexto = (puestos ?? [])
    .filter((p) => p.receta_id)
    .map((p) => {
      const r = recetas.find((x) => x.id === p.receta_id);
      return `${p.fecha} ${p.momento}: ${r?.nombre ?? "?"}`;
    });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 2000,
        system: INSTRUCCIONES,
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              recetario: catalogo,
              huecos,
              ya_ocupados: ocupadosTexto,
            }),
          },
        ],
      }),
    });

    if (!r.ok) {
      console.error("Anthropic:", r.status, await r.text());
      return { error: "No se ha podido montar la semana." };
    }

    const datos = await r.json();
    const salida = (datos.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const ini = salida.indexOf("{");
    const fin = salida.lastIndexOf("}");
    if (ini === -1 || fin <= ini) return { error: "Ha venido rara. Dale otra vez." };

    const { asignaciones } = JSON.parse(salida.slice(ini, fin + 1));
    if (!Array.isArray(asignaciones)) return { error: "Ha venido rara. Dale otra vez." };

    // Sólo aceptamos huecos que pedimos y recetas que existen: la IA
    // puede equivocarse de fecha o inventarse un id.
    const idsValidos = new Set(recetas.map((x) => x.id));
    const huecosValidos = new Set(huecos.map((h) => `${h.fecha}|${h.momento}`));

    const filas = asignaciones
      .filter(
        (a: { fecha?: string; momento?: string; receta_id?: string }) =>
          a.receta_id &&
          idsValidos.has(a.receta_id) &&
          huecosValidos.has(`${a.fecha}|${a.momento}`)
      )
      .map((a: { fecha: string; momento: string; receta_id: string }) => ({
        hogar_id: hogarId,
        fecha: a.fecha,
        momento: a.momento,
        receta_id: a.receta_id,
      }));

    if (!filas.length) return { error: "No ha propuesto nada aprovechable." };

    const { error } = await supabase
      .from("menu_semanal")
      .upsert(filas, { onConflict: "hogar_id,fecha,momento" });
    if (error) return { error: error.message };

    revalidatePath("/menu");
    return { ok: true, total: filas.length };
  } catch (e) {
    console.error(e);
    return { error: "No se ha podido montar la semana." };
  }
}
