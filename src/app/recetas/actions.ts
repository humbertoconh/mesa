"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";

export interface IngredienteIA {
  nombre: string;
  gramos: number;
  seccion: string;
  kcal_100: number;
  prot_100: number;
  carb_100: number;
  grasa_100: number;
}

export interface RecetaIA {
  nombre: string;
  raciones: number;
  etiquetas?: string[];
  minutos: number | null;
  pasos: string[];
  ingredientes: IngredienteIA[];
}

export async function guardarReceta(receta: RecetaIA, compartir = false) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: yo } = await supabase
    .from("miembros")
    .select("hogar_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!yo) return { error: "No estás en ninguna casa." };

  // Si se guarda ya compartida, hace falta el nombre del autor.
  let autor: string | null = null;
  if (compartir) {
    const { data: quien } = await supabase
      .from("miembros")
      .select("nombre")
      .eq("id", user.id)
      .maybeSingle();
    autor = quien?.nombre ?? null;
  }

  const { data: nueva, error: e1 } = await supabase
    .from("recetas")
    .insert({
      hogar_id: yo.hogar_id,
      publica: compartir,
      autor,
      nombre: receta.nombre,
      raciones_base: receta.raciones,
      minutos: receta.minutos,
      pasos: receta.pasos,
      etiquetas: receta.etiquetas ?? [],
    })
    .select("id")
    .single();
  if (e1 || !nueva) return { error: e1?.message ?? "No se ha podido guardar." };

  // Cada ingrediente se guarda como alimento de la casa, para que el
  // día de mañana se pueda reutilizar al apuntar comidas sueltas.
  for (const ing of receta.ingredientes) {
    const { data: alimento, error: e2 } = await supabase
      .from("alimentos")
      .insert({
        hogar_id: yo.hogar_id,
        nombre: ing.nombre,
        kcal_100: ing.kcal_100,
        prot_100: ing.prot_100,
        carb_100: ing.carb_100,
        grasa_100: ing.grasa_100,
        fuente: "ia",
      })
      .select("id")
      .single();
    if (e2 || !alimento) continue;

    await supabase.from("receta_ingredientes").insert({
      receta_id: nueva.id,
      alimento_id: alimento.id,
      gramos: ing.gramos,
      seccion: ing.seccion,
    });
  }

  revalidatePath("/recetas");
  revalidatePath("/menu");
  return { ok: true, id: nueva.id };
}

export async function borrarReceta(id: string) {
  const supabase = await clienteServidor();
  const { error } = await supabase.from("recetas").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/recetas");
  revalidatePath("/menu");
  return { ok: true };
}

export interface IngredienteEditado {
  id: string;
  gramos: number;
}

export async function actualizarReceta(
  id: string,
  datos: {
    nombre: string;
    raciones_base: number;
    minutos: number | null;
    pasos: string[];
    ingredientes: IngredienteEditado[];
    quitados: string[];
  }
) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { error: e1 } = await supabase
    .from("recetas")
    .update({
      nombre: datos.nombre,
      raciones_base: datos.raciones_base,
      minutos: datos.minutos,
      pasos: datos.pasos,
    })
    .eq("id", id);
  if (e1) return { error: e1.message };

  if (datos.quitados.length) {
    const { error } = await supabase
      .from("receta_ingredientes")
      .delete()
      .in("id", datos.quitados);
    if (error) return { error: error.message };
  }

  for (const ing of datos.ingredientes) {
    const { error } = await supabase
      .from("receta_ingredientes")
      .update({ gramos: ing.gramos })
      .eq("id", ing.id);
    if (error) return { error: error.message };
  }

  revalidatePath("/recetas");
  revalidatePath(`/recetas/${id}`);
  revalidatePath("/menu");
  return { ok: true };
}

export async function guardarFoto(id: string, url: string) {
  const supabase = await clienteServidor();
  const { error } = await supabase
    .from("recetas")
    .update({ foto_url: url })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/recetas");
  revalidatePath(`/recetas/${id}`);
  revalidatePath("/menu");
  revalidatePath("/hoy");
  return { ok: true };
}

export async function compartir(id: string, publica: boolean) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // Al compartir se guarda quién la aporta, para que salga en el
  // recetario común. Sólo el nombre de pila, nada más.
  const { data: yo } = await supabase
    .from("miembros")
    .select("nombre")
    .eq("id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("recetas")
    .update({ publica, autor: publica ? (yo?.nombre ?? null) : null })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/recetas/${id}`);
  revalidatePath("/recetas");
  return { ok: true };
}

export async function copiarReceta(id: string) {
  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("copiar_receta", { p_receta_id: id });
  if (error) return { error: error.message };

  revalidatePath("/recetas");
  revalidatePath("/menu");
  return { ok: true, id: data as string };
}

/**
 * Sube la foto de una receta.
 *
 * Va por el servidor a propósito: aquí la sesión viaja en la cookie y
 * Supabase nos ve como usuario identificado. Desde el navegador la
 * política de Storage nos tomaba por visitante anónimo.
 */
export async function subirFoto(recetaId: string, datos: FormData) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const archivo = datos.get("foto");
  console.log("FOTO: recibido", {
    esFile: archivo instanceof File,
    tipo: archivo instanceof File ? archivo.type : typeof archivo,
    bytes: archivo instanceof File ? archivo.size : 0,
  });

  if (!(archivo instanceof File) || !archivo.size) {
    return { error: "No ha llegado la foto (vacía o mal formada)." };
  }
  if (archivo.size > 3_000_000) {
    return { error: "La foto pesa demasiado." };
  }

  const { data: yo } = await supabase
    .from("miembros")
    .select("hogar_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!yo) return { error: "No estás en ninguna casa." };

  const ruta = `${yo.hogar_id}/${recetaId}-${Date.now()}.jpg`;

  // Subimos con fetch en vez de con el cliente de Supabase porque así
  // controlamos que el token del usuario viaje en la cabecera. Sin él,
  // Storage nos trata como visitante anónimo y la política de
  // 'authenticated' rechaza la subida.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    console.error("FOTO: sin token de sesión");
    return { error: "Tu sesión ha caducado. Vuelve a entrar." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const subida = await fetch(`${url}/storage/v1/object/recetas/${ruta}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${session.access_token}`,
      apikey: clave,
      "content-type": "image/jpeg",
      "x-upsert": "true",
    },
    body: await archivo.arrayBuffer(),
  });

  if (!subida.ok) {
    const detalle = await subida.text();
    console.error("FOTO: storage falla", subida.status, detalle);
    return { error: `Storage ${subida.status}: ${detalle.slice(0, 200)}` };
  }
  console.log("FOTO: subida ok", ruta);

  const { data: publica } = supabase.storage.from("recetas").getPublicUrl(ruta);

  const { error: e2 } = await supabase
    .from("recetas")
    .update({ foto_url: publica.publicUrl })
    .eq("id", recetaId);

  if (e2) {
    console.error("FOTO: update falla", JSON.stringify(e2));
    return { error: `Base de datos: ${e2.message}` };
  }
  console.log("FOTO: guardada", publica.publicUrl);

  revalidatePath("/recetas");
  revalidatePath(`/recetas/${recetaId}`);
  revalidatePath("/menu");
  revalidatePath("/hoy");
  return { ok: true, url: publica.publicUrl };
}
