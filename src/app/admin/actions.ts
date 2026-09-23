"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";

export async function cambiarEstado(hogarId: string, estado: string) {
  const supabase = await clienteServidor();
  const { error } = await supabase.rpc("cambiar_estado_hogar", {
    p_hogar_id: hogarId,
    p_estado: estado,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function borrarCasa(hogarId: string) {
  const supabase = await clienteServidor();
  const { error } = await supabase.rpc("borrar_hogar", { p_hogar_id: hogarId });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
