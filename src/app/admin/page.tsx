import Link from "next/link";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { FilaCasa, type Casa } from "@/components/FilaCasa";

export default async function Admin() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data, error } = await supabase.rpc("listar_hogares");

  // La función sólo devuelve filas al super. Si no hay, no es tu sitio.
  if (error || !data) redirect("/hoy");
  const casas = data as Casa[];

  const pendientes = casas.filter((c) => c.estado === "pendiente").length;

  return (
    <main className="mx-auto max-w-md pb-16">
      <header className="cabecera">
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
          Casas
        </h1>
        <p className="mt-1.5 text-[12.5px] opacity-80">
          {casas.length} en total
          {pendientes > 0 && ` · ${pendientes} esperando`}
        </p>
      </header>

      {pendientes > 0 && (
        <p className="mx-5 mt-5 rounded-xl bg-[var(--color-azafran-claro)] px-4 py-3 text-[13px] leading-relaxed text-[#7a5410]">
          Hay {pendientes} {pendientes === 1 ? "casa" : "casas"} esperando tu
          visto bueno. Hasta que no las apruebes, su gente no puede entrar.
        </p>
      )}

      <section className="mt-5 flex flex-col gap-2.5 px-5">
        {casas.map((c) => (
          <FilaCasa key={c.id} casa={c} />
        ))}
      </section>

      <div className="mt-8 px-5">
        <Link href="/hoy" className="text-[13px] text-[var(--color-tenue)] underline underline-offset-4">
          ← Volver a la app
        </Link>
      </div>
    </main>
  );
}
