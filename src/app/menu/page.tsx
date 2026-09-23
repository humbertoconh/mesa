import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirCasaActiva } from "@/lib/guardia";
import { hoyISO, type Momento } from "@/lib/objetivo";
import { calcularRacion, diasDeSemana, lunesDe, nombreDia } from "@/lib/racion";
import { Navegacion } from "@/components/Navegacion";
import { SelectorPlato } from "@/components/SelectorPlato";
import { BotonLista } from "@/components/BotonLista";
import { BotonSemana } from "@/components/BotonSemana";

const MOMENTOS_MENU: Momento[] = ["comida", "cena"];

interface RecetaConIngredientes {
  id: string;
  nombre: string;
  foto_url: string | null;
  raciones_base: number;
  receta_ingredientes: { gramos: number; alimentos: { kcal_100: number } | null }[];
}

export default async function Menu({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { supabase, user } = await exigirCasaActiva();

  const { semana } = await searchParams;
  const lunes = lunesDe(semana ?? hoyISO());
  const dias = diasDeSemana(lunes);

  const anterior = lunesDe(
    new Date(new Date(lunes + "T12:00:00").getTime() - 7 * 86400000)
      .toISOString()
      .slice(0, 10)
  );
  const siguiente = lunesDe(
    new Date(new Date(lunes + "T12:00:00").getTime() + 7 * 86400000)
      .toISOString()
      .slice(0, 10)
  );

  const { data: recetas } = await supabase
    .from("recetas")
    .select("id, nombre, foto_url, raciones_base, receta_ingredientes(gramos, alimentos(kcal_100))")
    .order("nombre")
    .returns<RecetaConIngredientes[]>();

  const { data: puestos } = await supabase
    .from("menu_semanal")
    .select("fecha, momento, receta_id")
    .in("fecha", dias);

  // Mi objetivo, para calcular MI ración. El de los demás no se puede
  // leer: es privado, y así debe seguir.
  const { data: objetivo } = await supabase
    .from("objetivos")
    .select("kcal_min, kcal_max")
    .eq("miembro_id", user.id)
    .order("desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  const kcalDia = objetivo
    ? (objetivo.kcal_min + objetivo.kcal_max) / 2
    : 0;

  const lista = recetas ?? [];
  const porId = new Map(lista.map((r) => [r.id, r]));
  const hoy = hoyISO();

  function datosPlato(fecha: string, momento: Momento) {
    const p = (puestos ?? []).find(
      (x) => x.fecha === fecha && x.momento === momento
    );
    if (!p?.receta_id) return null;
    const r = porId.get(p.receta_id);
    if (!r) return null;

    const gramos = r.receta_ingredientes.reduce((s, i) => s + Number(i.gramos), 0);
    const kcal = r.receta_ingredientes.reduce(
      (s, i) => s + (Number(i.gramos) * Number(i.alimentos?.kcal_100 ?? 0)) / 100,
      0
    );

    return {
      id: r.id,
      nombre: r.nombre,
      foto: r.foto_url,
      racion: kcalDia
        ? calcularRacion(gramos, kcal, r.raciones_base, kcalDia, momento)
        : null,
    };
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-none">
            Menú
          </h1>
          <p className="mt-1.5 text-[13px] text-[var(--color-tenue)]">
            Semana del {nombreDia(lunes)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Link
            href={`/menu?semana=${anterior}`}
            aria-label="Semana anterior"
            className="rounded-lg border border-[var(--color-linea)] px-3 py-2 text-[13px]"
          >
            ←
          </Link>
          <Link
            href={`/menu?semana=${siguiente}`}
            aria-label="Semana siguiente"
            className="rounded-lg border border-[var(--color-linea)] px-3 py-2 text-[13px]"
          >
            →
          </Link>
        </div>
      </div>

      {!lista.length ? (
        <div className="mt-10 rounded-xl border border-dashed border-[var(--color-linea)] px-5 py-8 text-center">
          <p className="text-[14px] leading-relaxed">
            Primero hacen falta recetas.
          </p>
          <Link
            href="/recetas/nueva"
            className="mt-4 inline-block rounded-lg bg-[var(--color-pino)] px-4 py-2.5 text-[13px] font-medium text-white"
          >
            Añadir la primera
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-6 flex flex-col gap-2.5">
            {dias.map((fecha) => (
              <article
                key={fecha}
                className={`tarjeta px-4 py-3 ${
                  fecha === hoy ? "ring-2 ring-[var(--color-lima)]" : ""
                }`}
              >
                <h2 className="text-[13px] font-medium capitalize">
                  {nombreDia(fecha)}
                  {fecha === hoy && (
                    <span className="text-[var(--color-pino)]"> · hoy</span>
                  )}
                </h2>
                <div className="mt-2 flex flex-col gap-2">
                  {MOMENTOS_MENU.map((m) => (
                    <div key={m} className="flex gap-3 border-t border-[var(--color-linea)] pt-2">
                      <span className="w-14 shrink-0 pt-0.5 text-[11px] uppercase tracking-wider text-[var(--color-tenue)]">
                        {m}
                      </span>
                      <div className="flex-1">
                        <SelectorPlato
                          fecha={fecha}
                          momento={m}
                          recetas={lista.map(({ id, nombre }) => ({ id, nombre }))}
                          puesto={datosPlato(fecha, m)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="mt-6 flex flex-col gap-3">
            <BotonSemana dias={dias} vacia={!(puestos ?? []).length} />
            <BotonLista lunes={lunes} dias={dias} />
            <div className="flex gap-2">
              <Link
                href="/compra"
                className="flex-1 rounded-xl border border-[var(--color-linea)] px-4 py-3 text-center text-[14px]"
              >
                Ver la lista
              </Link>
              <Link
                href="/recetas"
                className="flex-1 rounded-xl border border-[var(--color-linea)] px-4 py-3 text-center text-[14px]"
              >
                Recetario
              </Link>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/menu/imprimir?semana=${lunes}`}
                className="flex-1 rounded-xl border border-[var(--color-linea)] px-4 py-3 text-center text-[14px]"
              >
                Hoja para la nevera
              </Link>
            </div>
          </section>

          {!kcalDia && (
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-tenue)]">
              Cuando tengas tu objetivo calculado, aquí verás cuánto te toca a
              ti de cada plato.
            </p>
          )}
        </>
      )}

      <Navegacion />
    </main>
  );
}
