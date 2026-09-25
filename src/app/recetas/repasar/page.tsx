import Link from "next/link";
import { exigirCasaActiva } from "@/lib/guardia";
import { Repasador } from "@/components/Repasador";

interface Fila {
  id: string;
  nombre: string;
  etiquetas: string[] | null;
  region: string | null;
}

export default async function Repasar() {
  const { supabase } = await exigirCasaActiva();

  const { data: recetas } = await supabase
    .from("recetas")
    .select("id, nombre, etiquetas, region")
    .order("nombre")
    .returns<Fila[]>();

  return (
    <main className="mx-auto max-w-md pb-16">
      <header className="cabecera">
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
          Repasar clasificación
        </h1>
        <p className="mt-1.5 text-[12.5px] opacity-80">
          Poner al día las etiquetas de tus recetas.
        </p>
      </header>

      <Repasador recetas={recetas ?? []} />
    </main>
  );
}
