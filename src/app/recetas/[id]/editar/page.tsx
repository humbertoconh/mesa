import { notFound, redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { FormEditarReceta } from "@/components/FormEditarReceta";

interface Ficha {
  id: string;
  nombre: string;
  raciones_base: number;
  minutos: number | null;
  pasos: string[] | null;
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
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: receta } = await supabase
    .from("recetas")
    .select("id, nombre, raciones_base, minutos, pasos, receta_ingredientes(id, gramos, alimentos(nombre))")
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
