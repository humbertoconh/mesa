import Link from "next/link";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { Navegacion } from "@/components/Navegacion";
import { CodigoCasa } from "@/components/CodigoCasa";
import { salir } from "@/app/entrar/actions";

interface MiembroFila {
  id: string;
  nombre: string;
  rol: string;
}

const COLORES = [
  "var(--color-pino)",
  "var(--color-verde-claro, #8FBFA3)",
  "var(--color-azulejo)",
  "var(--color-ambar)",
];

export default async function Casa() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: yo } = await supabase
    .from("miembros")
    .select("hogar_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!yo) redirect("/empezar");

  const { data: hogar } = await supabase
    .from("hogares")
    .select("nombre, codigo")
    .eq("id", yo.hogar_id)
    .maybeSingle();

  const { data: miembros } = await supabase
    .from("miembros")
    .select("id, nombre, rol")
    .eq("hogar_id", yo.hogar_id)
    .order("creado_en")
    .returns<MiembroFila[]>();

  return (
    <main className="mx-auto max-w-md pb-28">
      <header className="cabecera">
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
          {hogar?.nombre ?? "Nuestra casa"}
        </h1>
        <p className="mt-1.5 text-[12.5px] opacity-80">
          {miembros?.length ?? 0}{" "}
          {miembros?.length === 1 ? "miembro" : "miembros"}
        </p>
      </header>

      <section className="mt-6 flex flex-col gap-2.5 px-5">
        {miembros?.map((m, i) => (
          <div
            key={m.id}
            className="tarjeta flex items-center gap-3 px-4 py-3.5"
          >
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-medium text-white"
              style={{ background: COLORES[i % COLORES.length] }}
            >
              {m.nombre.charAt(0).toUpperCase()}
            </span>
            <span className="flex-1 text-[14px]">
              {m.nombre}
              {m.id === user.id && (
                <span className="text-[var(--color-tenue)]"> · tú</span>
              )}
            </span>
            {m.rol === "admin" && (
              <span className="text-[11px] uppercase tracking-wider text-[var(--color-tenue)]">
                Admin
              </span>
            )}
          </div>
        ))}
      </section>

      {hogar?.codigo && (
        <section className="mt-6 px-5">
          <CodigoCasa codigo={hogar.codigo} />
        </section>
      )}

      <section className="mt-8 px-5">
        <h2 className="text-[13px] font-medium">Qué ve cada uno</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          <div className="tarjeta px-4 py-3">
            <div className="text-[13px] font-medium text-[var(--color-pino)]">
              Compartido
            </div>
            <div className="mt-1 text-[12px] text-[var(--color-tenue)]">
              Menú, recetas y lista de la compra
            </div>
          </div>
          <div className="tarjeta px-4 py-3">
            <div className="text-[13px] font-medium">Privado de cada uno</div>
            <div className="mt-1 text-[12px] text-[var(--color-tenue)]">
              Peso, registro de comidas y objetivo
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 px-5">
        <Link
          href="/perfil"
          className="tarjeta block px-4 py-3.5"
        >
          <span className="text-[14px] font-medium">Mis datos y mi objetivo</span>
          <span className="mt-0.5 block text-[12px] text-[var(--color-tenue)]">
            Altura, actividad, qué buscas. Al cambiarlo se recalcula.
          </span>
        </Link>
      </section>

      <form action={salir} className="mt-8 px-5">
        <button className="text-[13px] text-[var(--color-tenue)] underline underline-offset-4">
          Cerrar sesión
        </button>
      </form>

      <Navegacion />
    </main>
  );
}
