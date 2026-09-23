import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { FormPerfil } from "@/components/FormPerfil";

export default async function Perfil() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: miembro } = await supabase
    .from("miembros")
    .select("nombre, nacimiento, sexo, altura_cm, actividad")
    .eq("id", user.id)
    .maybeSingle();

  if (!miembro) redirect("/empezar");

  const { data: peso } = await supabase
    .from("pesos")
    .select("kg")
    .eq("miembro_id", user.id)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: objetivo } = await supabase
    .from("objetivos")
    .select("meta")
    .eq("miembro_id", user.id)
    .order("desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <FormPerfil
      yaHecho={Boolean(miembro.altura_cm)}
      inicial={{
        nombre: miembro.nombre,
        nacimiento: miembro.nacimiento ?? "",
        sexo: miembro.sexo ?? "",
        altura_cm: miembro.altura_cm ? String(miembro.altura_cm) : "",
        actividad: String(miembro.actividad ?? 1.4),
        meta: objetivo?.meta ?? "mantener",
        kg: peso?.kg ? String(peso.kg) : "",
      }}
    />
  );
}
