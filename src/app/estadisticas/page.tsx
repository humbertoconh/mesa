import Link from "next/link";
import { exigirCasaActiva } from "@/lib/guardia";
import { hoyISO } from "@/lib/objetivo";
import { Navegacion } from "@/components/Navegacion";
import { BarrasDias } from "@/components/BarrasDias";

const META_AGUA = 8;

function rango(dias: number): string[] {
  const hoy = new Date(hoyISO() + "T12:00:00");
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - (dias - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default async function Estadisticas({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const { supabase, user } = await exigirCasaActiva();
  const { vista } = await searchParams;
  const mensual = vista === "mes";
  const dias = rango(mensual ? 30 : 7);
  const desde = dias[0];

  const { data: registros } = await supabase
    .from("registro_comidas")
    .select("fecha, kcal, prot_g")
    .eq("miembro_id", user.id)
    .gte("fecha", desde);

  const { data: objetivos } = await supabase
    .from("objetivos")
    .select("desde, kcal_min, kcal_max")
    .eq("miembro_id", user.id)
    .order("desde");

  const { data: aguas } = await supabase
    .from("agua")
    .select("fecha, vasos")
    .eq("miembro_id", user.id)
    .gte("fecha", desde);

  const { data: pesos } = await supabase
    .from("pesos")
    .select("fecha, kg")
    .eq("miembro_id", user.id)
    .gte("fecha", desde)
    .order("fecha");

  // Kcal y proteína por día
  const porDia = new Map<string, { kcal: number; prot: number }>();
  (registros ?? []).forEach((r) => {
    const a = porDia.get(r.fecha) ?? { kcal: 0, prot: 0 };
    a.kcal += Number(r.kcal);
    a.prot += Number(r.prot_g);
    porDia.set(r.fecha, a);
  });

  /** El objetivo que estaba vigente ese día, no el de hoy. */
  function objetivoDe(fecha: string) {
    const previos = (objetivos ?? []).filter((o) => o.desde <= fecha);
    const o = previos[previos.length - 1] ?? (objetivos ?? [])[0];
    return { min: o?.kcal_min ?? 0, max: o?.kcal_max ?? 0 };
  }

  const filas = dias.map((fecha) => {
    const d = porDia.get(fecha);
    const o = objetivoDe(fecha);
    return {
      fecha,
      kcal: d?.kcal ?? 0,
      prot: d?.prot ?? 0,
      min: o.min,
      max: o.max,
      apuntado: Boolean(d),
    };
  });

  const apuntados = filas.filter((f) => f.apuntado);
  const dentro = apuntados.filter((f) => f.kcal >= f.min && f.kcal <= f.max).length;
  const pasados = apuntados.filter((f) => f.kcal > f.max).length;
  const cortos = apuntados.filter((f) => f.kcal < f.min).length;

  const mediaKcal = apuntados.length
    ? Math.round(apuntados.reduce((s, f) => s + f.kcal, 0) / apuntados.length)
    : 0;
  const mediaObjetivo = apuntados.length
    ? Math.round(apuntados.reduce((s, f) => s + (f.min + f.max) / 2, 0) / apuntados.length)
    : 0;
  const mediaProt = apuntados.length
    ? Math.round(apuntados.reduce((s, f) => s + f.prot, 0) / apuntados.length)
    : 0;

  const aguaPorDia = new Map((aguas ?? []).map((a) => [a.fecha, a.vasos]));
  const diasConAgua = [...aguaPorDia.values()].filter((v) => v > 0).length;
  const diasMetaAgua = [...aguaPorDia.values()].filter((v) => v >= META_AGUA).length;
  const mediaAgua = diasConAgua
    ? Math.round(([...aguaPorDia.values()].reduce((s, v) => s + v, 0) / diasConAgua) * 10) / 10
    : 0;

  const pesoIni = pesos?.[0]?.kg;
  const pesoFin = pesos?.[pesos.length - 1]?.kg;
  const difPeso =
    pesoIni != null && pesoFin != null && pesos!.length > 1
      ? Math.round((Number(pesoFin) - Number(pesoIni)) * 10) / 10
      : null;

  const tarjeta = "tarjeta px-4 py-3.5";

  return (
    <main className="mx-auto max-w-md pb-28">
      <header className="cabecera">
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
          Cómo va la cosa
        </h1>
        <p className="mt-1.5 text-[12.5px] opacity-80">
          {mensual ? "Últimos 30 días" : "Últimos 7 días"} · sólo lo ves tú
        </p>

        <div className="mt-4 flex gap-1.5">
          {[
            { v: "semana", t: "Semana" },
            { v: "mes", t: "Mes" },
          ].map((o) => (
            <Link
              key={o.v}
              href={`/estadisticas?vista=${o.v}`}
              className={`rounded-full px-4 py-2 text-[13px] font-medium ${
                (o.v === "mes") === mensual
                  ? "bg-white text-[var(--color-pino)]"
                  : "bg-white/20 text-white"
              }`}
            >
              {o.t}
            </Link>
          ))}
        </div>
      </header>

      {!apuntados.length ? (
        <div className="tarjeta mx-5 mt-8 px-5 py-8 text-center">
          <p className="text-[14px] leading-relaxed">
            Todavía no hay nada que contar en este periodo.
          </p>
          <p className="mt-2 text-[12.5px] text-[var(--color-tenue)]">
            Con tres o cuatro días apuntados ya empieza a verse algo.
          </p>
        </div>
      ) : (
        <>
          <section className={`${tarjeta} mx-5 mt-6`}>
            <h2 className="text-[13px] font-medium">Calorías por día</h2>
            <div className="mt-3">
              <BarrasDias dias={filas} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--color-tenue)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-pino)]" />
                en el rango
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-lima)]" />
                por debajo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-naranja)]" />
                por encima
              </span>
            </div>
          </section>

          <section className="mx-5 mt-3 grid grid-cols-3 gap-2.5">
            <div className="tarjeta px-3 py-3 text-center">
              <div className="cifra text-[20px] font-semibold text-[var(--color-pino)]">
                {dentro}
              </div>
              <div className="text-[11px] leading-tight text-[var(--color-tenue)]">
                días en el rango
              </div>
            </div>
            <div className="tarjeta px-3 py-3 text-center">
              <div className="cifra text-[20px] font-semibold text-[var(--color-lima)]">
                {cortos}
              </div>
              <div className="text-[11px] leading-tight text-[var(--color-tenue)]">
                por debajo
              </div>
            </div>
            <div className="tarjeta px-3 py-3 text-center">
              <div className="cifra text-[20px] font-semibold text-[var(--color-naranja)]">
                {pasados}
              </div>
              <div className="text-[11px] leading-tight text-[var(--color-tenue)]">
                por encima
              </div>
            </div>
          </section>

          <section className={`${tarjeta} mx-5 mt-3`}>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px]">Media diaria</span>
              <span className="cifra text-[15px] font-semibold">
                {mediaKcal.toLocaleString("es-ES")} kcal
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between text-[12px] text-[var(--color-tenue)]">
              <span>Tu objetivo medio</span>
              <span className="cifra">{mediaObjetivo.toLocaleString("es-ES")} kcal</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-[12px] text-[var(--color-tenue)]">
              <span>Proteína al día</span>
              <span className="cifra">{mediaProt} g</span>
            </div>
            <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--color-tenue)]">
              Sobre <span className="cifra">{apuntados.length}</span> de{" "}
              <span className="cifra">{filas.length}</span> días apuntados. Los
              días sin apuntar no cuentan: contarlos como cero falsearía la media.
            </p>
          </section>

          <section className={`${tarjeta} mx-5 mt-3`}>
            <h2 className="text-[13px] font-medium">Agua</h2>
            <div className="mt-3 flex gap-1">
              {dias.map((f) => {
                const v = aguaPorDia.get(f) ?? 0;
                const alto = Math.min(v / META_AGUA, 1);
                return (
                  <div key={f} className="flex-1" title={`${v} vasos`}>
                    <div className="flex h-12 items-end">
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: `${Math.max(alto * 100, v ? 8 : 4)}%`,
                          background: v >= META_AGUA
                            ? "var(--color-azulejo)"
                            : v > 0
                            ? "var(--color-azulejo-claro)"
                            : "var(--color-linea)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-baseline justify-between text-[12px]">
              <span className="text-[var(--color-tenue)]">
                Llegaste a los {META_AGUA} vasos
              </span>
              <span className="cifra font-semibold">
                {diasMetaAgua} de {filas.length} días
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-[12px] text-[var(--color-tenue)]">
              <span>Media de los días que apuntaste</span>
              <span className="cifra">{mediaAgua} vasos</span>
            </div>
          </section>

          {difPeso !== null && (
            <section className={`${tarjeta} mx-5 mt-3`}>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px]">Peso en el periodo</span>
                <span className="cifra text-[15px] font-semibold">
                  {difPeso > 0 ? "+" : ""}
                  {difPeso.toFixed(1).replace(".", ",")} kg
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-tenue)]">
                De {Number(pesoIni).toFixed(1).replace(".", ",")} a{" "}
                {Number(pesoFin).toFixed(1).replace(".", ",")} kg. En siete días
                el peso baila por agua y sal; la tendencia del mes dice mucho más.
              </p>
            </section>
          )}
        </>
      )}

      <div className="mt-8 px-5">
        <Link href="/progreso" className="text-[13px] text-[var(--color-tenue)] underline underline-offset-4">
          ← Progreso
        </Link>
      </div>

      <Navegacion />
    </main>
  );
}
