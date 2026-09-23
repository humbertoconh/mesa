"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";

export async function marcar(id: string, comprado: boolean) {
  const supabase = await clienteServidor();
  const { error } = await supabase
    .from("lista_compra")
    .update({ comprado })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/compra");
  return { ok: true };
}

export async function anadirAMano(_estado: string | null, datos: FormData) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "No has entrado.";

  const producto = String(datos.get("producto") ?? "").trim();
  const semana = String(datos.get("semana") ?? "");
  if (!producto) return null;

  const { data: yo } = await supabase
    .from("miembros")
    .select("hogar_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!yo) return "No estás en ninguna casa.";

  const { error } = await supabase.from("lista_compra").insert({
    hogar_id: yo.hogar_id,
    producto,
    seccion: "otros",
    manual: true,
    semana,
  });
  if (error) return error.message;

  revalidatePath("/compra");
  return null;
}

export async function limpiarComprados(semana: string) {
  const supabase = await clienteServidor();
  const { error } = await supabase
    .from("lista_compra")
    .delete()
    .eq("semana", semana)
    .eq("comprado", true);
  if (error) return { error: error.message };
  revalidatePath("/compra");
  return { ok: true };
}
