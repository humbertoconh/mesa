import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirCasaActiva } from "@/lib/guardia";
import { Navegacion } from "@/components/Navegacion";
import { BorrarReceta } from "@/components/BorrarReceta";
import { Miniatura } from "@/components/Miniatura";

interface RecetaFila {
  id: string;
  nombre: string;
  foto_url: string | null;
  raciones_base: number;
  minutos: number | null;
  receta_ingredientes: { gramos: number; alimentos: { kcal_100: number } | null }[];
}

export default async function Recetas() {
  const { supabase, user } = await exigirCasaActiva();

  const { data: recetas } = await supabase
    .from("recetas")
    .select("id, nombre, foto_url, raciones_base, minutos, receta_ingredientes(gramos, alimentos(kcal_100))")
    .order("nombre")
    .returns<RecetaFila[]>();

  const lista = recetas ?? [];

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-none">
            Recetario
          </h1>
          <p className="mt-1.5 text-[13px] text-[var(--color-tenue)]">
            {lista.length} {lista.length === 1 ? "receta" : "recetas"} de la casa
          </p>
        </div>
        <Link
          href="/recetas/nueva"
          className="shrink-0 rounded-full bg-[var(--color-naranja)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[var(--shadow-tarjeta)]"
        >
          + Añadir
        </Link>
      </div>

      <Link
        href="/recetas/importar"
        className="tarjeta mt-5 flex items-center gap-3 px-4 py-3.5"
      >
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-naranja-claro)] text-[18px]"
        >
          📋
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-semibold">Traer recetas en lote</span>
          <span className="block text-[12px] text-[var(--color-tenue)]">
            Pega una lista de platos y se escriben solas.
          </span>
        </span>
        <span aria-hidden className="text-[var(--color-tenue)]">→</span>
      </Link>

      <Link
        href="/recetas/compartidas"
        className="tarjeta mt-2.5 flex items-center gap-3 px-4 py-3.5"
      >
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-azulejo-claro)] text-[18px]"
        >
          🍲
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-semibold">Recetas de todos</span>
          <span className="block text-[12px] text-[var(--color-tenue)]">
            Lo que comparten otras casas. Cópialo a la tuya.
          </span>
        </span>
        <span aria-hidden className="text-[var(--color-tenue)]">→</span>
      </Link>

      {!lista.length && (
        <div className="tarjeta mt-10 px-5 py-8 text-center">
          <p className="text-[14px] leading-relaxed">
            Aquí van las recetas que de verdad cocináis.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-tenue)]">
            Con quince o veinte ya tienes para montar menús sin repetir. No hace
            falta meterlas todas hoy: ve añadiendo según cocinéis.
          </p>
        </div>
      )}

      <section className="mt-6 flex flex-col gap-2.5">
        {lista.map((r) => {
          const kcal = r.receta_ingredientes.reduce(
            (s, i) => s + (Number(i.gramos) * Number(i.alimentos?.kcal_100 ?? 0)) / 100,
            0
          );
          return (
            <article key={r.id} className="tarjeta flex items-center gap-3 px-3.5 py-3">
              <Miniatura nombre={r.nombre} foto={r.foto_url} />
              <Link href={`/recetas/${r.id}`} className="flex-1">
                <h2 className="text-[14px] font-semibold">{r.nombre}</h2>
                <p className="mt-0.5 text-[12px] text-[var(--color-tenue)]">
                  <span className="cifra">{Math.round(kcal / r.raciones_base)}</span> kcal
                  por ración · para {r.raciones_base}
                  {r.minutos ? ` · ${r.minutos} min` : ""}
                </p>
              </Link>
              <BorrarReceta id={r.id} nombre={r.nombre} />
            </article>
          );
        })}
      </section>

      <Navegacion />
    </main>
  );
}
