import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { Navegacion } from "@/components/Navegacion";
import { ModoCocina } from "@/components/ModoCocina";
import { RecetaEscalada } from "@/components/RecetaEscalada";

interface Ficha {
  id: string;
  nombre: string;
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
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: receta } = await supabase
    .from("recetas")
    .select("id, nombre, raciones_base, minutos, pasos, hogar_id, receta_ingredientes(gramos, seccion, alimentos(nombre, kcal_100))")
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
    <main className="mx-auto max-w-md px-5 pb-28 pt-10">
      <Link href="/recetas" className="text-[13px] text-[var(--color-tenue)]">
        ← Recetario
      </Link>

      <h1 className="mt-3 font-[family-name:var(--font-display)] text-[26px] font-semibold leading-tight">
        {receta.nombre}
      </h1>
      {receta.minutos && (
        <p className="mt-1.5 text-[13px] text-[var(--color-tenue)]">
          <span className="cifra">{receta.minutos}</span> minutos
        </p>
      )}

      <RecetaEscalada
        ingredientes={ingredientes}
        racionesBase={receta.raciones_base}
        comensales={count ?? receta.raciones_base}
      />

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

      <Navegacion />
    </main>
  );
}
