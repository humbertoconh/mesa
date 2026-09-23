import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";

/**
 * Portero de las pantallas de dentro: que haya sesión, que estés en una
 * casa y que la casa esté aprobada. Devuelve lo que casi todas las
 * pantallas necesitan, para no repetir la consulta.
 */
export async function exigirCasaActiva() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: miembro } = await supabase
    .from("miembros")
    .select("hogar_id, nombre, rol, altura_cm, hogares(estado)")
    .eq("id", user.id)
    .maybeSingle();

  if (!miembro) redirect("/empezar");

  const estado = (miembro as unknown as { hogares: { estado: string } | null })
    .hogares?.estado;
  if (estado !== "activa") redirect("/espera");

  return { supabase, user, miembro };
}
