"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { calcularObjetivo, edadDesde, hoyISO, type Meta, type Sexo } from "@/lib/objetivo";

export async function guardarPeso(_estado: string | null, datos: FormData) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const kg = Number(datos.get("kg"));
  const cintura = datos.get("cintura_cm") ? Number(datos.get("cintura_cm")) : null;

  if (!kg || kg < 25 || kg > 300) return "Ese peso no parece correcto.";

  const { error } = await supabase.from("pesos").upsert(
    { miembro_id: user.id, fecha: hoyISO(), kg, cintura_cm: cintura },
    { onConflict: "miembro_id,fecha" }
  );
  if (error) return error.message;

  await recalcularObjetivo(user.id, kg);

  revalidatePath("/progreso");
  revalidatePath("/hoy");
  return null;
}

/**
 * Recalcula el objetivo con el peso real de hoy.
 * Sólo si el objetivo vigente está marcado como automático: si lo has
 * puesto a mano, no te lo tocamos.
 */
async function recalcularObjetivo(miembroId: string, kg: number) {
  const supabase = await clienteServidor();

  const { data: miembro } = await supabase
    .from("miembros")
    .select("nacimiento, sexo, altura_cm, actividad")
    .eq("id", miembroId)
    .maybeSingle();

  const { data: vigente } = await supabase
    .from("objetivos")
    .select("meta, automatico, desde")
    .eq("miembro_id", miembroId)
    .order("desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!miembro?.nacimiento || !miembro.altura_cm || !vigente?.automatico) return;
  // Uno al día es suficiente: el peso baila 1 kg entre la mañana y la noche.
  if (vigente.desde === hoyISO()) return;

  const objetivo = calcularObjetivo({
    kg,
    altura_cm: Number(miembro.altura_cm),
    edad: edadDesde(miembro.nacimiento),
    sexo: (miembro.sexo ?? "h") as Sexo,
    actividad: Number(miembro.actividad),
    meta: vigente.meta as Meta,
  });

  await supabase
    .from("objetivos")
    .insert({ miembro_id: miembroId, meta: vigente.meta, ...objetivo });
}

/**
 * Vasos de agua de hoy. Se guarda el total, no cada vaso: así dar dos
 * veces al botón sin querer no suma de más.
 */
export async function ponerAgua(vasos: number) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const limitado = Math.min(Math.max(vasos, 0), 20);

  const { error } = await supabase.from("agua").upsert(
    { miembro_id: user.id, fecha: hoyISO(), vasos: limitado },
    { onConflict: "miembro_id,fecha" }
  );
  if (error) return { error: error.message };

  revalidatePath("/progreso");
  return { ok: true };
}
