import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";

const MODELO = process.env.MODELO_IA ?? "claude-sonnet-5";

const INSTRUCCIONES = `Eres un cocinero que conoce la cocina española y valenciana.
Te van a pegar una receta escrita de cualquier manera: una lista de la abuela,
un párrafo, o sólo el nombre del plato. Devuélvela estructurada.

Reglas:
- Si no dicen para cuántos es, supón 4.
- Si sólo te dan el nombre del plato, monta la receta tradicional de casa.
- Incluye el aceite y la sal aunque no los mencionen.
- Los valores nutricionales son por 100 g del ingrediente CRUDO, tal y como
  se compra. No del plato terminado.
- Sección: fruta_verdura, carniceria, pescaderia, lacteos, panaderia,
  congelados, despensa u otros. Es para agrupar la lista de la compra.
- Pasos: 4 a 8 frases cortas. Nada de párrafos largos.

Responde SÓLO con el JSON, sin markdown ni texto alrededor:
{"nombre":"...","raciones":4,"minutos":45,
 "ingredientes":[{"nombre":"...","gramos":0,"seccion":"despensa",
   "kcal_100":0,"prot_100":0,"carb_100":0,"grasa_100":0}],
 "pasos":["...","..."]}`;

const SECCIONES = ["fruta_verdura", "carniceria", "pescaderia", "lacteos",
                   "panaderia", "congelados", "despensa", "otros"];

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
  if (!user) return NextResponse.json({ error: "No has entrado." }, { status: 401 });

  const { texto } = await peticion.json();
  if (typeof texto !== "string" || texto.trim().length < 3) {
    return NextResponse.json({ error: "Escribe la receta o su nombre." }, { status: 400 });
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
        max_tokens: 4000,
        system: INSTRUCCIONES,
        messages: [{ role: "user", content: texto.slice(0, 4000) }],
      }),
    });

    if (!r.ok) {
      console.error("Anthropic:", r.status, await r.text());
      return NextResponse.json({ error: "No se ha podido leer la receta." }, { status: 502 });
    }

    const datos = await r.json();
    if (datos.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "La receta es muy larga. Quítale pasos y vuelve a probar." },
        { status: 502 }
      );
    }

    const salida = (datos.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const p = extraerJSON(salida);
    if (!p || !Array.isArray(p.ingredientes) || !p.ingredientes.length) {
      console.error("No parseable:", salida.slice(0, 400));
      return NextResponse.json({ error: "Ha venido rara. Dale otra vez." }, { status: 502 });
    }

    const receta = {
      nombre: String(p.nombre ?? "Receta sin nombre").slice(0, 120),
      raciones: Math.min(Math.max(Number(p.raciones) || 4, 1), 20),
      minutos: Number(p.minutos) || null,
      pasos: Array.isArray(p.pasos)
        ? p.pasos.slice(0, 12).map((s: unknown) => String(s).slice(0, 300))
        : [],
      ingredientes: p.ingredientes
        .filter((i: Record<string, unknown>) => i && typeof i.nombre === "string")
        .slice(0, 40)
        .map((i: Record<string, unknown>) => ({
          nombre: String(i.nombre).slice(0, 80),
          gramos: Number(i.gramos) || 0,
          seccion: SECCIONES.includes(String(i.seccion)) ? String(i.seccion) : "despensa",
          kcal_100: Number(i.kcal_100) || 0,
          prot_100: Number(i.prot_100) || 0,
          carb_100: Number(i.carb_100) || 0,
          grasa_100: Number(i.grasa_100) || 0,
        })),
    };

    return NextResponse.json({ receta });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se ha podido leer la receta." }, { status: 500 });
  }
}
