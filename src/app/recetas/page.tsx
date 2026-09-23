import Link from "next/link";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { Navegacion } from "@/components/Navegacion";
import { BorrarReceta } from "@/components/BorrarReceta";

interface RecetaFila {
  id: string;
  nombre: string;
  raciones_base: number;
  minutos: number | null;
  receta_ingredientes: { gramos: number; alimentos: { kcal_100: number } | null }[];
}

export default async function Recetas() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: recetas } = await supabase
    .from("recetas")
    .select("id, nombre, raciones_base, minutos, receta_ingredientes(gramos, alimentos(kcal_100))")
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
          className="shrink-0 rounded-lg bg-[var(--color-pino)] px-3.5 py-2.5 text-[13px] font-medium text-white"
        >
          Añadir
        </Link>
      </div>

      {!lista.length && (
        <div className="mt-10 rounded-xl border border-dashed border-[var(--color-linea)] px-5 py-8 text-center">
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
            <article
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3.5"
            >
              <Link href={`/recetas/${r.id}`} className="flex-1">
                <h2 className="text-[14px] font-medium">{r.nombre}</h2>
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
