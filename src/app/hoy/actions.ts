"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/objetivo";
import type { AlimentoDesglosado } from "@/lib/tipos";

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
