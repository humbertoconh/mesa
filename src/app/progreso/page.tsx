import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { hoyISO } from "@/lib/objetivo";
import { Navegacion } from "@/components/Navegacion";
import { ApuntarPeso } from "@/components/ApuntarPeso";
import { GraficaPeso } from "@/components/GraficaPeso";

interface PesoFila {
  fecha: string;
  kg: number;
  cintura_cm: number | null;
}

export default async function Progreso() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: pesos } = await supabase
    .from("pesos")
    .select("fecha, kg, cintura_cm")
    .eq("miembro_id", user.id)
    .order("fecha")
    .limit(60)
    .returns<PesoFila[]>();

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
    <main className="mx-auto max-w-md px-5 pb-28 pt-10">
      <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-none">
        Progreso
      </h1>
      <p className="mt-1.5 text-[13px] text-[var(--color-tenue)]">
        Sólo lo ves tú.
      </p>

      <section className="mt-7 rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-4">
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

      <section className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3.5 text-center">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-tenue)]">
            Días apuntados
          </div>
          <div className="cifra mt-1 text-[22px] font-semibold">{porDia.size}</div>
          <div className="text-[11px] text-[var(--color-tenue)]">de los últimos 7</div>
        </div>
        <div className="rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3.5 text-center">
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
        <section className="mt-3 rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3.5">
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

      <section className="mt-6">
        {pesadoHoy ? (
          <p className="rounded-xl border border-dashed border-[var(--color-linea)] px-4 py-4 text-center text-[13px] text-[var(--color-tenue)]">
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
