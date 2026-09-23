"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";

export async function expulsar(miembroId: string) {
  const supabase = await clienteServidor();
  const { error } = await supabase.rpc("expulsar_miembro", {
    p_miembro_id: miembroId,
  });
  if (error) return { error: error.message };

  revalidatePath("/casa");
  return { ok: true };
}
