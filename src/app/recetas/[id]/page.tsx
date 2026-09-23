import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirCasaActiva } from "@/lib/guardia";
import { Navegacion } from "@/components/Navegacion";
import { ModoCocina } from "@/components/ModoCocina";
import { RecetaEscalada } from "@/components/RecetaEscalada";
import { FotoReceta } from "@/components/FotoReceta";
import { Compartir } from "@/components/Compartir";

interface Ficha {
  id: string;
  nombre: string;
  foto_url: string | null;
  publica: boolean;
  tipo: string | null;
  region: string | null;
  temporada: string | null;
  dificultad: string | null;
  veces_copiada: number;
  etiquetas: string[] | null;
  raciones_base: number;
  minutos: number | null;
  pasos: string[] | null;
  hogar_id: string;
  receta_ingredientes: {
    gramos: number;
    seccion: string;
    alimentos: { nombre: string; kcal_100: number } | null;
  }[];
}

export default async function FichaReceta({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await exigirCasaActiva();

  const { data: receta } = await supabase
    .from("recetas")
    .select("id, nombre, foto_url, publica, veces_copiada, etiquetas, tipo, region, temporada, dificultad, raciones_base, minutos, pasos, hogar_id, receta_ingredientes(gramos, seccion, alimentos(nombre, kcal_100))")
    .eq("id", id)
    .maybeSingle<Ficha>();

  if (!receta) notFound();

  const { count } = await supabase
    .from("miembros")
    .select("id", { count: "exact", head: true })
    .eq("hogar_id", receta.hogar_id);

  const ingredientes = receta.receta_ingredientes
    .filter((i) => i.alimentos)
    .map((i) => ({
      nombre: i.alimentos!.nombre,
      gramos: Number(i.gramos),
      seccion: i.seccion,
      kcal_100: Number(i.alimentos!.kcal_100),
    }));

  const pasos = receta.pasos ?? [];

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-8">
      <div className="flex items-center justify-between">
        <Link href="/recetas" className="text-[13px] text-[var(--color-tenue)]">
          ← Recetario
        </Link>
        <Link
          href={`/recetas/${receta.id}/editar`}
          className="text-[13px] text-[var(--color-pino)] underline underline-offset-4"
        >
          Editar
        </Link>
      </div>

      <div className="mt-4">
        <FotoReceta
          recetaId={receta.id}
          foto={receta.foto_url}
          nombre={receta.nombre}
        />
      </div>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-[26px] font-semibold leading-tight">
        {receta.nombre}
      </h1>
      <p className="mt-1.5 text-[13px] text-[var(--color-tenue)]">
        {[
          receta.tipo,
          receta.region,
          receta.minutos ? `${receta.minutos} min` : null,
          receta.dificultad,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <RecetaEscalada
        ingredientes={ingredientes}
        racionesBase={receta.raciones_base}
        comensales={count ?? receta.raciones_base}
      />

      {receta.etiquetas && receta.etiquetas.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {receta.etiquetas.map((e) => (
            <span
              key={e}
              className="rounded-full bg-[var(--color-azafran-claro)] px-2.5 py-1 text-[11px] font-medium text-[#7a5410]"
            >
              {e}
            </span>
          ))}
        </div>
      )}

      {pasos.length > 0 && (
        <>
          <h2 className="mt-7 text-[13px] font-medium">Cómo se hace</h2>
          <ol className="mt-3 flex flex-col gap-4">
            {pasos.map((paso, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="cifra grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-pino-claro)] text-[12px] font-medium text-[var(--color-pino)]">
                  {i + 1}
                </span>
                <p className="text-[14px] leading-relaxed">{paso}</p>
              </li>
            ))}
          </ol>

          <div className="mt-7">
            <ModoCocina />
          </div>
        </>
      )}

      <Compartir
        id={receta.id}
        publica={receta.publica}
        veces={receta.veces_copiada}
      />

      <Navegacion />
    </main>
  );
}
