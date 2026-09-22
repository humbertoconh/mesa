import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";

const MODELO = process.env.MODELO_IA ?? "claude-sonnet-5";

const INSTRUCCIONES = `Eres un nutricionista que trabaja con cocina española y valenciana.
Te van a describir una comida en lenguaje normal. Desglósala en alimentos.

Reglas:
- Estima gramos razonables cuando no te den cantidad. Una ración normal de
  casa, no de restaurante.
- Cuenta el aceite de cocinado aunque no lo mencionen: en la cocina española
  hay aceite de oliva casi siempre. Un sofrito son unos 10 g, un frito 15 g.
- Si algo es un plato compuesto (paella, cocido, fideuà), desglósalo en sus
  ingredientes principales.
- Si mencionan una marca concreta y no la conoces, trátalo como el producto
  genérico equivalente. No te pares a razonar sobre la marca.
- Si la descripción no contiene comida, devuelve una lista vacía.

Responde SÓLO con el JSON, sin markdown, sin explicaciones y sin texto antes
ni después. Nombres cortos, de tres palabras como mucho. Esta forma exacta:
{"alimentos":[{"nombre":"...","gramos":0,"kcal":0,"prot_g":0,"carb_g":0,"grasa_g":0}]}`;

/** Saca el objeto JSON aunque venga con markdown o texto alrededor. */
function extraerJSON(bruto: string) {
  const limpio = bruto.replace(/```json|```/g, "").trim();
  const ini = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (ini === -1 || fin <= ini) return null;
  try {
    return JSON.parse(limpio.slice(ini, fin + 1));
  } catch {
    return null;
  }
}

export async function POST(peticion: Request) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No has entrado." }, { status: 401 });
  }

  const { texto } = await peticion.json();
  if (typeof texto !== "string" || texto.trim().length < 3) {
    return NextResponse.json({ error: "Escribe qué has comido." }, { status: 400 });
  }

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
        max_tokens: 2000,
        system: INSTRUCCIONES,
        messages: [{ role: "user", content: texto.slice(0, 1000) }],
      }),
    });

    if (!r.ok) {
      console.error("Anthropic:", r.status, await r.text());
      return NextResponse.json(
        { error: "No se ha podido desglosar. Pruébalo otra vez." },
        { status: 502 }
      );
    }

    const datos = await r.json();

    // Si se corta por falta de espacio, el JSON llega sin cerrar.
    if (datos.stop_reason === "max_tokens") {
      console.error("Respuesta cortada por max_tokens");
      return NextResponse.json(
        { error: "Se ha hecho muy largo. Pruébalo en dos veces, comida por comida." },
        { status: 502 }
      );
    }

    const salida = (datos.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const parseado = extraerJSON(salida);
    if (!parseado || !Array.isArray(parseado.alimentos)) {
      console.error("Respuesta no parseable:", salida.slice(0, 500));
      return NextResponse.json(
        { error: "La respuesta ha venido rara. Dale otra vez." },
        { status: 502 }
      );
    }

    // Nos quedamos sólo con lo que tiene la forma correcta: si viene un
    // campo suelto mal, no queremos guardar NaN en la base.
    const alimentos = parseado.alimentos
      .filter((a: Record<string, unknown>) => a && typeof a.nombre === "string")
      .map((a: Record<string, unknown>) => ({
        nombre: String(a.nombre).slice(0, 80),
        gramos: Number(a.gramos) || 0,
        kcal: Number(a.kcal) || 0,
        prot_g: Number(a.prot_g) || 0,
        carb_g: Number(a.carb_g) || 0,
        grasa_g: Number(a.grasa_g) || 0,
      }));

    return NextResponse.json({ alimentos });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se ha podido desglosar. Pruébalo otra vez." },
      { status: 500 }
    );
  }
}
