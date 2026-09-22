"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";

export async function entrar(_estado: string | null, datos: FormData) {
  const supabase = await clienteServidor();
  const correo = String(datos.get("correo") ?? "").trim();
  const clave = String(datos.get("clave") ?? "");

  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: clave,
  });

  if (error) return "Ese correo o esa contraseña no cuadran.";
  revalidatePath("/", "layout");
  redirect("/");
}

export async function registrarse(_estado: string | null, datos: FormData) {
  const supabase = await clienteServidor();
  const correo = String(datos.get("correo") ?? "").trim();
  const clave = String(datos.get("clave") ?? "");

  if (clave.length < 8) return "La contraseña necesita 8 caracteres como mínimo.";

  const { error } = await supabase.auth.signUp({ email: correo, password: clave });
  if (error) return error.message;

  revalidatePath("/", "layout");
  redirect("/");
}

export async function salir() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}
