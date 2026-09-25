import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";
import {
  DIFICULTADES, ETIQUETAS, REGIONES, TEMPORADAS, TIPOS,
} from "@/lib/clasificacion";

const MODELO = process.env.MODELO_IA ?? "claude-sonnet-5";

const INSTRUCCIONES = `Clasificas recetas de cocina española. Te doy el nombre
de un plato y sus ingredientes, y devuelves su clasificación.

Usa SÓLO valores de estas listas, tal cual:
region: ${REGIONES.join(", ")}
tipo: ${TIPOS.join(", ")}
temporada: ${TEMPORADAS.join(", ")}
dificultad: ${DIFICULTADES.join(", ")}
etiquetas: ${ETIQUETAS.join(", ")}

Criterios:
- region: si no es de una comunidad concreta, "De toda España"; si no es
  español, "De fuera".
- dificultad: NO por el tiempo total, sino por los minutos con las manos
  ocupadas y si hay algún paso donde te la juegas. Unas lentejas tardan
  dos horas y son fáciles.
- etiquetas: de 3 a 6, las que de verdad apliquen. No las fuerces.
  «airfryer» sólo si se hace en freidora de aire.
  «alta cocina» sólo si es plato de restaurante, con técnica o emplatado
  que no se hace un martes cualquiera en casa.

Responde SÓLO con este JSON:
{"region":"...","tipo":"...","temporada":"...","dificultad":"...","etiquetas":["..."]}`;

export async function POST(peticion: Request) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No has entrado." }, { status: 401 });

  const { id } = await peticion.json();
  if (!id) return NextResponse.json({ error: "Falta la receta." }, { status: 400 });

  const { data: receta } = await supabase
    .from("recetas")
    .select("nombre, receta_ingredientes(gramos, alimentos(nombre))")
    .eq("id", id)
    .maybeSingle();

  if (!receta) return NextResponse.json({ error: "No existe." }, { status: 404 });

  const fila = receta as unknown as {
    nombre: string;
    receta_ingredientes: { gramos: number; alimentos: { nombre: string } | null }[];
  };

  const resumen = {
    plato: fila.nombre,
    ingredientes: fila.receta_ingredientes
      .map((i) => i.alimentos?.nombre)
      .filter(Boolean)
      .slice(0, 25),
  };

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 400,
        system: INSTRUCCIONES,
        messages: [{ role: "user", content: JSON.stringify(resumen) }],
      }),
    });

    if (!r.ok) {
      console.error("Anthropic:", r.status, await r.text());
      return NextResponse.json({ error: "No se ha podido clasificar." }, { status: 502 });
    }

    const datos = await r.json();
    const salida = (datos.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const ini = salida.indexOf("{");
    const fin = salida.lastIndexOf("}");
    if (ini === -1 || fin <= ini) {
      return NextResponse.json({ error: "Respuesta rara." }, { status: 502 });
    }
    const p = JSON.parse(salida.slice(ini, fin + 1));

    const clasificacion = {
      region: (REGIONES as readonly string[]).includes(p.region) ? p.region : null,
      tipo: (TIPOS as readonly string[]).includes(p.tipo) ? p.tipo : null,
      temporada: (TEMPORADAS as readonly string[]).includes(p.temporada)
        ? p.temporada : "todo el año",
      dificultad: (DIFICULTADES as readonly string[]).includes(p.dificultad)
        ? p.dificultad : null,
      etiquetas: Array.isArray(p.etiquetas)
        ? p.etiquetas
            .map((e: unknown) => String(e).toLowerCase().trim())
            .filter((e: string) => (ETIQUETAS as readonly string[]).includes(e))
            .slice(0, 6)
        : [],
    };

    const { error } = await supabase
      .from("recetas")
      .update(clasificacion)
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ nombre: fila.nombre, ...clasificacion });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se ha podido clasificar." }, { status: 500 });
  }
}
