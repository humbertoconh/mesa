import Link from "next/link";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { Navegacion } from "@/components/Navegacion";
import { Miniatura } from "@/components/Miniatura";
import { BotonCopiar } from "@/components/BotonCopiar";

interface Fila {
  id: string;
  nombre: string;
  foto_url: string | null;
  autor: string | null;
  etiquetas: string[];
  minutos: number | null;
  veces_copiada: number;
  raciones_base: number;
  hogar_id: string;
  receta_ingredientes: { gramos: number; alimentos: { kcal_100: number } | null }[];
}

export default async function Compartidas({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: yo } = await supabase
    .from("miembros")
    .select("hogar_id")
    .eq("id", user.id)
    .maybeSingle();

  let consulta = supabase
    .from("recetas")
    .select("id, nombre, foto_url, autor, etiquetas, minutos, veces_copiada, raciones_base, hogar_id, receta_ingredientes(gramos, alimentos(kcal_100))")
    .eq("publica", true)
    .order("veces_copiada", { ascending: false })
    .limit(60);

  if (q) consulta = consulta.ilike("nombre", `%${q}%`);

  const { data: recetas } = await consulta.returns<Fila[]>();

  // Las de tu propia casa no se copian a sí mismas.
  const lista = (recetas ?? []).filter((r) => r.hogar_id !== yo?.hogar_id);

  return (
    <main className="mx-auto max-w-md pb-28">
      <header className="cabecera">
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
          Recetas de todos
        </h1>
        <p className="mt-1.5 text-[12.5px] opacity-80">
          Lo que otras casas han querido compartir.
        </p>

        <form className="mt-4">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar un plato…"
            className="w-full rounded-full bg-white/95 px-4 py-2.5 text-[14px] text-[var(--color-tinta)] placeholder:text-[var(--color-tenue)]"
          />
        </form>
      </header>

      {!lista.length ? (
        <div className="tarjeta mx-5 mt-8 px-5 py-8 text-center">
          <p className="text-[14px] leading-relaxed">
            {q ? "No hay nada con ese nombre." : "Todavía no hay recetas compartidas."}
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-tenue)]">
            Comparte tú alguna desde su ficha y empieza la rueda.
          </p>
          <Link
            href="/recetas"
            className="mt-4 inline-block rounded-full bg-[var(--color-pino)] px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            Mi recetario
          </Link>
        </div>
      ) : (
        <section className="mt-6 flex flex-col gap-2.5 px-5">
          {lista.map((r) => {
            const kcal = r.receta_ingredientes.reduce(
              (s, i) => s + (Number(i.gramos) * Number(i.alimentos?.kcal_100 ?? 0)) / 100,
              0
            );
            return (
              <article key={r.id} className="tarjeta flex flex-wrap items-center gap-3 px-3.5 py-3">
                <Miniatura nombre={r.nombre} foto={r.foto_url} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-[14px] font-semibold">{r.nombre}</h2>
                  <p className="mt-0.5 text-[12px] text-[var(--color-tenue)]">
                    <span className="cifra">{Math.round(kcal / r.raciones_base)}</span> kcal
                    {r.minutos ? ` · ${r.minutos} min` : ""}
                    {r.autor ? ` · de ${r.autor}` : ""}
                  </p>
                  {r.etiquetas?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {r.etiquetas.slice(0, 3).map((e) => (
                        <span
                          key={e}
                          className="rounded-full bg-[var(--color-azafran-claro)] px-2 py-0.5 text-[10.5px] font-medium text-[#7a5410]"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <BotonCopiar id={r.id} />
              </article>
            );
          })}
        </section>
      )}

      <Navegacion />
    </main>
  );
}
