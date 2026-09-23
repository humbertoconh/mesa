import { redirect } from "next/navigation";
import { exigirCasaActiva } from "@/lib/guardia";
import { hoyISO } from "@/lib/objetivo";
import { Navegacion } from "@/components/Navegacion";
import { ApuntarPeso } from "@/components/ApuntarPeso";
import { GraficaPeso } from "@/components/GraficaPeso";
import { Agua } from "@/components/Agua";
import Link from "next/link";

interface PesoFila {
  fecha: string;
  kg: number;
  cintura_cm: number | null;
}

export default async function Progreso() {
  const { supabase, user } = await exigirCasaActiva();

  const { data: pesos } = await supabase
    .from("pesos")
    .select("fecha, kg, cintura_cm")
    .eq("miembro_id", user.id)
    .order("fecha")
    .limit(60)
    .returns<PesoFila[]>();

  const { data: agua } = await supabase
    .from("agua")
    .select("vasos")
    .eq("miembro_id", user.id)
    .eq("fecha", hoyISO())
    .maybeSingle();

  const { data: objetivo } = await supabase
    .from("objetivos")
    .select("kcal_min, kcal_max, meta, desde")
    .eq("miembro_id", user.id)
    .order("desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lista = pesos ?? [];
  const ultimo = lista.length ? lista[lista.length - 1] : null;
  const hoy = hoyISO();
  const pesadoHoy = ultimo?.fecha === hoy;

  // Media de los últimos 7 días con registro, que es más honesta que
  // la última cifra suelta.
  const { data: recientes } = await supabase
    .from("registro_comidas")
    .select("fecha, kcal")
    .eq("miembro_id", user.id)
    .gte("fecha", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));

  const porDia = new Map<string, number>();
  (recientes ?? []).forEach((r: { fecha: string; kcal: number }) =>
    porDia.set(r.fecha, (porDia.get(r.fecha) ?? 0) + Number(r.kcal))
  );
  const media = porDia.size
    ? Math.round([...porDia.values()].reduce((a, b) => a + b, 0) / porDia.size)
    : null;

  return (
    <main className="mx-auto max-w-md pb-28">
      <header className="cabecera">
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
          Progreso
        </h1>
        <p className="mt-1.5 text-[12.5px] opacity-80">Sólo lo ves tú.</p>
      </header>

      <section className="tarjeta mx-5 mt-6 px-4 py-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[13px] font-medium">Peso</h2>
          {ultimo && (
            <span className="cifra text-[15px] font-medium">{ultimo.kg} kg</span>
          )}
        </div>
        <div className="mt-3">
          <GraficaPeso puntos={lista.map(({ fecha, kg }) => ({ fecha, kg: Number(kg) }))} />
        </div>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3 px-5">
        <div className="tarjeta px-4 py-3.5 text-center">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-tenue)]">
            Días apuntados
          </div>
          <div className="cifra mt-1 text-[22px] font-semibold">{porDia.size}</div>
          <div className="text-[11px] text-[var(--color-tenue)]">de los últimos 7</div>
        </div>
        <div className="tarjeta px-4 py-3.5 text-center">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-tenue)]">
            Media
          </div>
          <div className="cifra mt-1 text-[22px] font-semibold">
            {media ? media.toLocaleString("es-ES") : "—"}
          </div>
          <div className="text-[11px] text-[var(--color-tenue)]">kcal / día</div>
        </div>
      </section>

      {objetivo && (
        <section className="tarjeta mx-5 mt-3 px-4 py-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium">Objetivo actual</span>
            <span className="cifra text-[13px]">
              {objetivo.kcal_min.toLocaleString("es-ES")}–
              {objetivo.kcal_max.toLocaleString("es-ES")} kcal
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-tenue)]">
            Se ajusta solo cada vez que apuntas el peso, según lo que esté
            pasando de verdad y no según la previsión del primer día.
          </p>
        </section>
      )}

      <section className="mt-3 px-5">
        <Agua vasos={agua?.vasos ?? 0} />
      </section>

      <section className="mt-3 px-5">
        <Link href="/estadisticas" className="tarjeta flex items-center gap-3 px-4 py-3.5">
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-azulejo-claro)] text-[18px]"
          >
            📊
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-semibold">Cómo va la cosa</span>
            <span className="block text-[12px] text-[var(--color-tenue)]">
              La semana y el mes, en calorías y en agua.
            </span>
          </span>
          <span aria-hidden className="text-[var(--color-tenue)]">→</span>
        </Link>
      </section>

      <section className="mt-6 px-5">
        {pesadoHoy ? (
          <p className="tarjeta px-4 py-4 text-center text-[13px] text-[var(--color-tenue)]">
            Hoy ya te has pesado. Nos vemos mañana.
          </p>
        ) : (
          <ApuntarPeso ultimo={ultimo ? Number(ultimo.kg) : null} />
        )}
      </section>

      <Navegacion />
    </main>
  );
}
