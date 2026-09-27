"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { clave } from "@/lib/despensa";

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

export async function poner(nombre: string) {
  const { supabase, hogarId } = await miHogar();
  if (!hogarId) return { error: "No estás en ninguna casa." };

  const limpio = nombre.trim().slice(0, 80);
  if (!limpio) return { error: "Escribe algo." };

  const { error } = await supabase
    .from("despensa")
    .upsert(
      { hogar_id: hogarId, clave: clave(limpio), nombre: limpio },
      { onConflict: "hogar_id,clave" }
    );
  if (error) return { error: error.message };

  revalidatePath("/compra/despensa");
  return { ok: true };
}

export async function quitar(claveProducto: string) {
  const { supabase, hogarId } = await miHogar();
  if (!hogarId) return { error: "No estás en ninguna casa." };

  const { error } = await supabase
    .from("despensa")
    .delete()
    .eq("hogar_id", hogarId)
    .eq("clave", claveProducto);
  if (error) return { error: error.message };

  revalidatePath("/compra/despensa");
  return { ok: true };
}
