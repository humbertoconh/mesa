import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/objetivo";

const MODELO = process.env.MODELO_IA ?? "claude-sonnet-5";

const INSTRUCCIONES = `Eres alguien con criterio que ayuda a una familia a comer
mejor. Te dan los números de un mes y escribes una valoración corta.

Cómo escribir:
- Trato de tú, cercano, como un amigo que sabe del tema. Nada de coach ni
  de frases motivacionales.
- Español de España, lenguaje llano.
- Reconoce lo que ha ido bien antes que lo que no.
- Concreto: «cena más proteína» vale; «cuida tu alimentación» no.

Reglas que no se saltan:
- NUNCA propongas comer por debajo del objetivo calculado, ni saltarse
  comidas, ni ayunar, ni acelerar la pérdida de peso.
- NUNCA llames fracaso a un día fuera de rango. Un día suelto no es nada.
- Los días sin apuntar no son pereza: señálalos sólo si son tantos que
  los números no significan gran cosa.
- Si el peso ha bajado más de 4 kg en el mes, o la media de calorías está
  muy por debajo del objetivo, dilo con calma y sugiere consultarlo con
  el médico. Sin alarmismo y sin dramatizar.
- No diagnostiques nada ni hables de enfermedades.
- Si hay pocos datos, dilo claramente y no te inventes tendencias.

Responde SÓLO con este JSON, sin markdown:
{"titulo":"cuatro o cinco palabras",
 "parrafos":["...","..."],
 "consejos":[{"que":"frase corta","porque":"una línea"}]}

Dos o tres párrafos de tres líneas como mucho. De dos a cuatro consejos.`;

export async function POST() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No has entrado." }, { status: 401 });

  // Los números se calculan aquí, no se reciben del navegador.
  const hoy = new Date(hoyISO() + "T12:00:00");
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - 29);
  const desdeISO = desde.toISOString().slice(0, 10);

  const [{ data: registros }, { data: objetivos }, { data: aguas }, { data: pesos }] =
    await Promise.all([
      supabase.from("registro_comidas")
        .select("fecha, kcal, prot_g").eq("miembro_id", user.id).gte("fecha", desdeISO),
      supabase.from("objetivos")
        .select("desde, kcal_min, kcal_max, meta").eq("miembro_id", user.id).order("desde"),
      supabase.from("agua")
        .select("fecha, vasos").eq("miembro_id", user.id).gte("fecha", desdeISO),
      supabase.from("pesos")
        .select("fecha, kg").eq("miembro_id", user.id).gte("fecha", desdeISO).order("fecha"),
    ]);

  const porDia = new Map<string, { kcal: number; prot: number }>();
  (registros ?? []).forEach((r) => {
    const a = porDia.get(r.fecha) ?? { kcal: 0, prot: 0 };
    a.kcal += Number(r.kcal);
    a.prot += Number(r.prot_g);
    porDia.set(r.fecha, a);
  });

  if (porDia.size < 5) {
    return NextResponse.json(
      { error: "Hacen falta al menos cinco días apuntados para valorar el mes." },
      { status: 400 }
    );
  }

  const ultimo = (objetivos ?? [])[objetivos!.length - 1];
  const min = ultimo?.kcal_min ?? 0;
  const max = ultimo?.kcal_max ?? 0;

  const valores = [...porDia.values()];
  const dentro = valores.filter((v) => v.kcal >= min && v.kcal <= max).length;
  const pasados = valores.filter((v) => v.kcal > max).length;
  const cortos = valores.filter((v) => v.kcal < min).length;

  const vasos = (aguas ?? []).map((a) => a.vasos);
  const pesoIni = pesos?.[0]?.kg;
  const pesoFin = pesos?.[pesos.length - 1]?.kg;

  const datos = {
    dias_del_periodo: 30,
    dias_apuntados: porDia.size,
    objetivo: { min, max, meta: ultimo?.meta ?? "mantener" },
    kcal_media: Math.round(valores.reduce((s, v) => s + v.kcal, 0) / valores.length),
    proteina_media: Math.round(valores.reduce((s, v) => s + v.prot, 0) / valores.length),
    dias_en_rango: dentro,
    dias_por_encima: pasados,
    dias_por_debajo: cortos,
    agua: {
      dias_apuntados: vasos.length,
      dias_con_ocho_vasos: vasos.filter((v) => v >= 8).length,
      media: vasos.length
        ? Math.round((vasos.reduce((s, v) => s + v, 0) / vasos.length) * 10) / 10
        : 0,
    },
    peso: pesos && pesos.length > 1
      ? {
          inicio: Number(pesoIni),
          final: Number(pesoFin),
          diferencia: Math.round((Number(pesoFin) - Number(pesoIni)) * 10) / 10,
          pesadas: pesos.length,
        }
      : null,
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
        max_tokens: 1200,
        system: INSTRUCCIONES,
        messages: [{ role: "user", content: JSON.stringify(datos) }],
      }),
    });

    if (!r.ok) {
      console.error("Anthropic:", r.status, await r.text());
      return NextResponse.json({ error: "No se ha podido valorar el mes." }, { status: 502 });
    }

    const respuesta = await r.json();
    const salida = (respuesta.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const ini = salida.indexOf("{");
    const fin = salida.lastIndexOf("}");
    if (ini === -1 || fin <= ini) {
      return NextResponse.json({ error: "Ha venido rara. Dale otra vez." }, { status: 502 });
    }

    const p = JSON.parse(salida.slice(ini, fin + 1));
    return NextResponse.json({
      titulo: String(p.titulo ?? "Cómo ha ido el mes").slice(0, 80),
      parrafos: (p.parrafos ?? []).slice(0, 4).map((x: unknown) => String(x).slice(0, 500)),
      consejos: (p.consejos ?? []).slice(0, 4).map((c: Record<string, unknown>) => ({
        que: String(c.que ?? "").slice(0, 120),
        porque: String(c.porque ?? "").slice(0, 200),
      })),
      datos,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se ha podido valorar el mes." }, { status: 500 });
  }
}
