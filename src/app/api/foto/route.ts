import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";

const MODELO = process.env.MODELO_IA ?? "claude-sonnet-5";

const INSTRUCCIONES = `Miras fotos relacionadas con comida, en contexto español.
Hay dos casos y tienes que distinguirlos tú:

1. ETIQUETA. La foto muestra la tabla de información nutricional de un
   producto envasado. Lee los valores POR 100 g (o por 100 ml). Si la tabla
   sólo da valores por ración, conviértelos a 100 g usando el tamaño de
   ración que indique. Si viene en kJ y no en kcal, divide entre 4,184.
   Devuelve: {"tipo":"etiqueta","alimento":{"nombre":"...","marca":null,
   "kcal_100":0,"prot_100":0,"carb_100":0,"grasa_100":0}}

2. PLATO. La foto muestra comida servida. Desglósala en alimentos con los
   gramos que estimes a ojo, contando el aceite de cocinado, que en la
   cocina española casi siempre lo hay aunque no se vea.
   Devuelve: {"tipo":"plato","alimentos":[{"nombre":"...","gramos":0,
   "kcal":0,"prot_g":0,"carb_g":0,"grasa_g":0}]}

Si la foto no es ninguna de las dos cosas, o no se lee:
{"tipo":"nada"}

Responde SÓLO con el JSON, sin markdown ni texto alrededor.`;

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

const num = (v: unknown) => Number(v) || 0;

export async function POST(peticion: Request) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No has entrado." }, { status: 401 });

  const { imagen, tipo_medio } = await peticion.json();
  if (typeof imagen !== "string" || imagen.length < 100) {
    return NextResponse.json({ error: "No ha llegado la foto." }, { status: 400 });
  }
  // ~7 MB en base64: por encima, la foto no se ha reducido bien.
  if (imagen.length > 7_000_000) {
    return NextResponse.json({ error: "La foto es demasiado grande." }, { status: 413 });
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
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: tipo_medio === "image/png" ? "image/png" : "image/jpeg",
                  data: imagen,
                },
              },
              { type: "text", text: "¿Qué hay en esta foto?" },
            ],
          },
        ],
      }),
    });

    if (!r.ok) {
      console.error("Anthropic:", r.status, await r.text());
      return NextResponse.json({ error: "No se ha podido leer la foto." }, { status: 502 });
    }

    const datos = await r.json();
    if (datos.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "Se ha hecho largo. Prueba con una foto más sencilla." },
        { status: 502 }
      );
    }

    const salida = (datos.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const p = extraerJSON(salida);
    if (!p?.tipo) {
      console.error("No parseable:", salida.slice(0, 400));
      return NextResponse.json({ error: "Ha venido rara. Dale otra vez." }, { status: 502 });
    }

    if (p.tipo === "etiqueta" && p.alimento?.nombre) {
      return NextResponse.json({
        tipo: "etiqueta",
        alimento: {
          nombre: String(p.alimento.nombre).slice(0, 80),
          marca: p.alimento.marca ? String(p.alimento.marca).slice(0, 60) : null,
          kcal_100: num(p.alimento.kcal_100),
          prot_100: num(p.alimento.prot_100),
          carb_100: num(p.alimento.carb_100),
          grasa_100: num(p.alimento.grasa_100),
        },
      });
    }

    if (p.tipo === "plato" && Array.isArray(p.alimentos) && p.alimentos.length) {
      return NextResponse.json({
        tipo: "plato",
        alimentos: p.alimentos
          .filter((a: Record<string, unknown>) => a && typeof a.nombre === "string")
          .slice(0, 20)
          .map((a: Record<string, unknown>) => ({
            nombre: String(a.nombre).slice(0, 80),
            gramos: num(a.gramos),
            kcal: num(a.kcal),
            prot_g: num(a.prot_g),
            carb_g: num(a.carb_g),
            grasa_g: num(a.grasa_g),
          })),
      });
    }

    return NextResponse.json(
      { error: "Ahí no veo ni comida ni una etiqueta. Prueba de más cerca." },
      { status: 422 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se ha podido leer la foto." }, { status: 500 });
  }
}
