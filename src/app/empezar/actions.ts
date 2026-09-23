"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/server";
import { avisar } from "@/lib/correo";

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

  const { data: { user } } = await supabase.auth.getUser();
  await avisar(
    `Casa nueva pendiente: ${nombre}`,
    `<strong>${miNombre}</strong> (${user?.email ?? "sin correo"}) ha creado la
     casa <strong>${nombre}</strong> y está esperando tu aprobación.
     Hasta que no le des el visto bueno, no puede usar la app.`,
    "/admin"
  );

  revalidatePath("/", "layout");
  // La casa nace pendiente: la raíz decide si vas al perfil o a esperar.
  redirect("/");
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

  const { data: { user } } = await supabase.auth.getUser();
  await avisar(
    `${miNombre} ha entrado en una casa`,
    `<strong>${miNombre}</strong> (${user?.email ?? "sin correo"}) ha entrado
     con el código <strong>${codigo.toUpperCase()}</strong>.`,
    "/admin"
  );
  revalidatePath("/", "layout");
  redirect("/perfil");
}
