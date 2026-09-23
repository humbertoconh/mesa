import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";

export default async function Inicio() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: miembro } = await supabase
    .from("miembros")
    .select("id, altura_cm, hogares(estado)")
    .eq("id", user.id)
    .maybeSingle();

  if (!miembro) redirect("/empezar");

  const estado = (miembro as unknown as { hogares: { estado: string } | null })
    .hogares?.estado;
  if (estado !== "activa") redirect("/espera");

  if (!miembro.altura_cm) redirect("/perfil");
  redirect("/hoy");
}
