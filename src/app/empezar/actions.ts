"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";

export async function crearHogar(_estado: string | null, datos: FormData) {
  const supabase = await clienteServidor();
  const nombre = String(datos.get("nombre") ?? "").trim();
  const miNombre = String(datos.get("mi_nombre") ?? "").trim();

  if (!nombre || !miNombre) return "Faltan datos.";

  const { error } = await supabase.rpc("crear_hogar", {
    p_nombre: nombre,
    p_mi_nombre: miNombre,
  });

  if (error) return error.message;
  revalidatePath("/", "layout");
  redirect("/perfil");
}

export async function unirse(_estado: string | null, datos: FormData) {
  const supabase = await clienteServidor();
  const codigo = String(datos.get("codigo") ?? "").trim();
  const miNombre = String(datos.get("mi_nombre") ?? "").trim();

  if (!codigo || !miNombre) return "Faltan datos.";

  const { error } = await supabase.rpc("unirse_a_hogar", {
    p_codigo: codigo,
    p_mi_nombre: miNombre,
  });

  if (error) return error.message;
  revalidatePath("/", "layout");
  redirect("/perfil");
}
