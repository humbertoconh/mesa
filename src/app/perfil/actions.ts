"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";
import { calcularObjetivo, edadDesde, hoyISO, type Meta, type Sexo } from "@/lib/objetivo";

export async function guardarPerfil(_estado: string | null, datos: FormData) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const nacimiento = String(datos.get("nacimiento") ?? "");
  const sexo = String(datos.get("sexo") ?? "") as Sexo;
  const altura_cm = Number(datos.get("altura_cm"));
  const actividad = Number(datos.get("actividad"));
  const meta = String(datos.get("meta") ?? "mantener") as Meta;
  const kg = Number(datos.get("kg"));

  if (!nacimiento || !altura_cm || !kg) return "Faltan datos.";

  const nombre = String(datos.get("nombre") ?? "").trim();

  const { error: e1 } = await supabase
    .from("miembros")
    .update({ nombre, nacimiento, sexo, altura_cm, actividad })
    .eq("id", user.id);
  if (e1) return e1.message;

  const { error: e2 } = await supabase
    .from("pesos")
    .upsert({ miembro_id: user.id, fecha: hoyISO(), kg }, { onConflict: "miembro_id,fecha" });
  if (e2) return e2.message;

  const objetivo = calcularObjetivo({
    kg,
    altura_cm,
    edad: edadDesde(nacimiento),
    sexo,
    actividad,
    meta,
  });

  const { error: e3 } = await supabase
    .from("objetivos")
    .insert({ miembro_id: user.id, meta, ...objetivo });
  if (e3) return e3.message;

  revalidatePath("/", "layout");
  redirect("/hoy");
}
