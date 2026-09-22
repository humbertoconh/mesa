import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import { hoyISO, MOMENTOS } from "@/lib/objetivo";
import { Anillo } from "@/components/Anillo";
import { Macro } from "@/components/Macro";
import { AnadirComida } from "@/components/AnadirComida";
import { FilaRegistro } from "@/components/Registro";
import { Navegacion } from "@/components/Navegacion";
import type { ObjetivoFila, Registro } from "@/lib/tipos";

export default async function Hoy() {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: miembro } = await supabase
    .from("miembros")
    .select("nombre, altura_cm, hogar_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!miembro) redirect("/empezar");
  if (!miembro.altura_cm) redirect("/perfil");

  const { data: objetivo } = await supabase
    .from("objetivos")
    .select("*")
    .eq("miembro_id", user.id)
    .order("desde", { ascending: false })
    .limit(1)
    .maybeSingle<ObjetivoFila>();

  if (!objetivo) redirect("/perfil");

  const { data: registros } = await supabase
    .from("registro_comidas")
    .select("*")
    .eq("miembro_id", user.id)
    .eq("fecha", hoyISO())
    .order("creado_en")
    .returns<Registro[]>();

  const filas = registros ?? [];
  const suma = (c: keyof Registro) =>
    filas.reduce((s, r) => s + Number(r[c] ?? 0), 0);

  const fecha = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-10">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-[26px] font-semibold leading-none">
            Hola, {miembro.nombre}
          </h1>
          <p className="mt-1.5 text-[13px] text-[var(--color-tenue)] first-letter:uppercase">
            {fecha}
          </p>
        </div>
      </header>

      <section className="mt-8">
        <Anillo
          consumidas={suma("kcal")}
          min={objetivo.kcal_min}
          max={objetivo.kcal_max}
        />
      </section>

      <section className="mt-8 flex flex-col gap-3.5">
        <Macro nombre="Proteína" actual={suma("prot_g")} objetivo={objetivo.prot_g}
               color="var(--color-pino)" />
        <Macro nombre="Carbohidratos" actual={suma("carb_g")} objetivo={objetivo.carb_g}
               color="var(--color-azulejo)" />
        <Macro nombre="Grasas" actual={suma("grasa_g")} objetivo={objetivo.grasa_g}
               color="var(--color-ambar)" />
      </section>

      <section className="mt-9 flex flex-col gap-3">
        {MOMENTOS.map((m) => {
          const delMomento = filas.filter((r) => r.momento === m);
          if (!delMomento.length) return null;
          const kcal = delMomento.reduce((s, r) => s + Number(r.kcal), 0);

          return (
            <article key={m} className="rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[14px] font-medium capitalize">{m}</h2>
                <span className="cifra text-[13px] text-[var(--color-tenue)]">
                  {Math.round(kcal)} kcal
                </span>
              </div>
              <ul className="mt-1 divide-y divide-[var(--color-linea)]">
                {delMomento.map((r) => (
                  <FilaRegistro key={r.id} r={r} />
                ))}
              </ul>
            </article>
          );
        })}

        {!filas.length && (
          <p className="py-4 text-center text-[14px] text-[var(--color-tenue)]">
            Todavía no has apuntado nada hoy.
          </p>
        )}

        <AnadirComida />
      </section>

      <Navegacion />
    </main>
  );
}
