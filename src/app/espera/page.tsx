import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { salir } from "@/app/entrar/actions";

export default async function Espera() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: miembro } = await supabase
    .from("miembros")
    .select("nombre, hogares(nombre, estado)")
    .eq("id", user.id)
    .maybeSingle();

  if (!miembro) redirect("/empezar");

  const casa = (miembro as unknown as {
    hogares: { nombre: string; estado: string } | null;
  }).hogares;

  if (casa?.estado === "activa") redirect("/hoy");
  const bloqueada = casa?.estado === "bloqueada";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-16 text-center">
      <div
        aria-hidden
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--color-azafran-claro)] text-[26px]"
      >
        {bloqueada ? "🔒" : "⏳"}
      </div>

      <h1 className="mt-5 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-tight">
        {bloqueada ? "Esta casa está bloqueada" : "Casa pendiente de aprobar"}
      </h1>

      <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-tenue)]">
        {bloqueada
          ? "Habla con quien administra Mesa para saber qué ha pasado."
          : `«${casa?.nombre ?? "Tu casa"}» está a la espera de que la aprueben. En cuanto lo hagan, entras sin tener que registrarte otra vez.`}
      </p>

      <form action={salir} className="mt-8">
        <button className="text-[13px] text-[var(--color-tenue)] underline underline-offset-4">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
