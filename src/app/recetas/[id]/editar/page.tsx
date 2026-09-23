import { notFound, redirect } from "next/navigation";
import { exigirCasaActiva } from "@/lib/guardia";
import { FormEditarReceta } from "@/components/FormEditarReceta";

interface Ficha {
  id: string;
  nombre: string;
  raciones_base: number;
  minutos: number | null;
  pasos: string[] | null;
  region: string | null;
  tipo: string | null;
  temporada: string | null;
  dificultad: string | null;
  etiquetas: string[] | null;
  receta_ingredientes: {
    id: string;
    gramos: number;
    alimentos: { nombre: string } | null;
  }[];
}

export default async function EditarReceta({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await exigirCasaActiva();

  const { data: receta } = await supabase
    .from("recetas")
    .select("id, nombre, raciones_base, minutos, pasos, region, tipo, temporada, dificultad, etiquetas, receta_ingredientes(id, gramos, alimentos(nombre))")
    .eq("id", id)
    .maybeSingle<Ficha>();

  if (!receta) notFound();

  return (
    <FormEditarReceta
      id={receta.id}
      nombre={receta.nombre}
      raciones={receta.raciones_base}
      minutos={receta.minutos}
      pasos={receta.pasos ?? []}
      region={receta.region}
      tipo={receta.tipo}
      temporada={receta.temporada}
      dificultad={receta.dificultad}
      etiquetas={receta.etiquetas ?? []}
      ingredientes={receta.receta_ingredientes
        .filter((i) => i.alimentos)
        .map((i) => ({
          id: i.id,
          nombre: i.alimentos!.nombre,
          gramos: Number(i.gramos),
        }))}
    />
  );
}
