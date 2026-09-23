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
  region?: string | null;
  tipo?: string | null;
  temporada?: string | null;
  dificultad?: string | null;
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
      region: receta.region ?? null,
      tipo: receta.tipo ?? null,
      temporada: receta.temporada ?? null,
      dificultad: receta.dificultad ?? null,
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
    region: string | null;
    tipo: string | null;
    temporada: string | null;
    dificultad: string | null;
    etiquetas: string[];
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
      region: datos.region,
      tipo: datos.tipo,
      temporada: datos.temporada,
      dificultad: datos.dificultad,
      etiquetas: datos.etiquetas,
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

  // La subida la hace el servidor con la clave de servicio.
  //
  // Esa clave se salta el RLS, así que la autorización la hemos hecho
  // nosotros unas líneas más arriba: hay sesión, el usuario pertenece a
  // una casa, y el archivo se guarda dentro de la carpeta de SU casa.
  // La clave vive sólo en el servidor y nunca sale de aquí.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const servicio = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let token = servicio;
  if (!token) {
    // Sin clave de servicio, se intenta con la sesión del usuario.
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
    console.log("FOTO: sin clave de servicio, uso la sesión");
  }

  if (!token) {
    return { error: "Falta configurar la clave del servidor." };
  }

  const subida = await fetch(`${url}/storage/v1/object/recetas/${ruta}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      apikey: token,
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
