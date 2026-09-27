import { redirect } from "next/navigation";
import { exigirCasaActiva } from "@/lib/guardia";
import { fechaLarga, hoyISO, MOMENTOS, type Momento } from "@/lib/objetivo";
import { Anillo } from "@/components/Anillo";
import { Macro } from "@/components/Macro";
import { AnadirComida } from "@/components/AnadirComida";
import { FilaRegistro } from "@/components/Registro";
import { Navegacion } from "@/components/Navegacion";
import { PlatoDeHoy } from "@/components/PlatoDeHoy";
import { Habituales, type Habitual } from "@/components/Habituales";
import { CambiarDia } from "@/components/CambiarDia";
import { CopiarDia, type DiaCandidato } from "@/components/CopiarDia";
import { calcularRacion } from "@/lib/racion";
import type { ObjetivoFila, Registro } from "@/lib/tipos";

export default async function Hoy({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: pedida } = await searchParams;
  const { supabase, user } = await exigirCasaActiva();

  const hoy = hoyISO();

  // El día que se está mirando. Ni futuro ni de hace más de un año.
  const limite = new Date(hoy + "T12:00:00");
  limite.setFullYear(limite.getFullYear() - 1);
  const valida =
    pedida &&
    /^\d{4}-\d{2}-\d{2}$/.test(pedida) &&
    pedida <= hoy &&
    pedida >= limite.toISOString().slice(0, 10);
  const dia = valida ? pedida : hoy;
  const esHoy = dia === hoy;


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
    .eq("fecha", dia)
    .order("creado_en")
    .returns<Registro[]>();

  const filas = registros ?? [];
  const suma = (c: keyof Registro) =>
    filas.reduce((s, r) => s + Number(r[c] ?? 0), 0);

  const fecha = esHoy
    ? fechaLarga()
    : new Date(dia + "T12:00:00").toLocaleDateString("es-ES", {
        weekday: "long", day: "numeric", month: "long",
      });

  // Lo que toca hoy según el menú de la casa, con mi ración calculada.
  const { data: puestos } = await supabase
    .from("menu_semanal")
    .select("momento, recetas(id, nombre, foto_url, raciones_base, receta_ingredientes(gramos, alimentos(kcal_100)))")
    .eq("fecha", dia);

  const kcalDia = (objetivo.kcal_min + objetivo.kcal_max) / 2;

  const platosHoy = (puestos ?? []).flatMap((p) => {
    const fila = p as unknown as {
      momento: Momento;
      recetas: {
        id: string;
        nombre: string;
        foto_url: string | null;
        raciones_base: number;
        receta_ingredientes: { gramos: number; alimentos: { kcal_100: number } | null }[];
      } | null;
    };
    const r = fila.recetas;
    if (!r) return [];

    const gramos = r.receta_ingredientes.reduce((s, i) => s + Number(i.gramos), 0);
    const kcal = r.receta_ingredientes.reduce(
      (s, i) => s + (Number(i.gramos) * Number(i.alimentos?.kcal_100 ?? 0)) / 100,
      0
    );

    return [{
      momento: fila.momento,
      nombre: r.nombre,
      foto: r.foto_url,
      racion: calcularRacion(gramos, kcal, r.raciones_base, kcalDia, fila.momento),
      yaApuntado: filas.some((f) => f.momento === fila.momento && f.descripcion === r.nombre),
    }];
  });

  // Lo que más repites: sirve para apuntarlo de un toque.
  const { data: historico } = await supabase
    .from("registro_comidas")
    .select("fecha, descripcion, momento, gramos, kcal, prot_g, carb_g, grasa_g")
    .eq("miembro_id", user.id)
    .neq("fecha", dia)
    .gte("fecha", new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10))
    .order("creado_en", { ascending: false })
    .limit(300);

  const cuenta = new Map<string, Habitual>();
  (historico ?? []).forEach((r) => {
    const nombre = r.descripcion;
    if (!nombre) return;
    const previo = cuenta.get(nombre);
    if (previo) {
      previo.veces++;
      return;
    }
    cuenta.set(nombre, {
      nombre,
      momento: r.momento,
      gramos: Number(r.gramos ?? 0),
      kcal: Number(r.kcal),
      prot_g: Number(r.prot_g),
      carb_g: Number(r.carb_g),
      grasa_g: Number(r.grasa_g),
      veces: 1,
    });
  });

  // Días recientes con algo apuntado, para poder copiarlos tal cual.
  const resumenDias = new Map<string, { kcal: number; platos: number }>();
  (historico ?? []).forEach((r) => {
    const f = (r as { fecha: string }).fecha;
    const a = resumenDias.get(f) ?? { kcal: 0, platos: 0 };
    a.kcal += Number(r.kcal);
    a.platos++;
    resumenDias.set(f, a);
  });

  const candidatos: DiaCandidato[] = [...resumenDias.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
    .map(([fecha, d]) => ({ fecha, kcal: d.kcal, platos: d.platos }));

  const habituales = [...cuenta.values()]
    .filter((h) => h.veces >= 2)
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 6);

  return (
    <main className="mx-auto max-w-md pb-28">
      <header className="cabecera">
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
          {esHoy ? `Hola, ${miembro.nombre}` : "Otro día"}
        </h1>
        <div className="mt-2.5">
          <CambiarDia fecha={dia} hoy={hoy} texto={fecha} />
        </div>

        <div className="mt-5">
          <Anillo
            consumidas={suma("kcal")}
            min={objetivo.kcal_min}
            max={objetivo.kcal_max}
          />
        </div>
      </header>

      <section className="-mt-5 flex gap-2.5 px-5">
        <Macro nombre="Proteína" actual={suma("prot_g")} objetivo={objetivo.prot_g}
               color="var(--color-pino)" fondo="var(--color-pino-claro)" />
        <Macro nombre="Carbos" actual={suma("carb_g")} objetivo={objetivo.carb_g}
               color="var(--color-azulejo)" fondo="var(--color-azulejo-claro)" />
        <Macro nombre="Grasas" actual={suma("grasa_g")} objetivo={objetivo.grasa_g}
               color="var(--color-naranja)" fondo="var(--color-naranja-claro)" />
      </section>

      {platosHoy.length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-tenue)]">
            {esHoy ? "Hoy en el menú" : "Ese día tocaba"}
          </h2>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {platosHoy.map((p) => (
              <PlatoDeHoy key={p.momento} fecha={dia} {...p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 flex flex-col gap-3 px-5">
        {filas.length > 0 && (
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-tenue)]">
            {esHoy ? "Lo que llevas hoy" : "Lo de ese día"}
          </h2>
        )}

        {MOMENTOS.map((m) => {
          const delMomento = filas.filter((r) => r.momento === m);
          if (!delMomento.length) return null;
          const kcal = delMomento.reduce((s, r) => s + Number(r.kcal), 0);

          return (
            <article key={m} className="tarjeta px-4 py-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[14px] font-semibold capitalize">{m}</h3>
                <span className="cifra rounded-full bg-[var(--color-pino-claro)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-pino)]">
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
          <div className="tarjeta px-5 py-7 text-center">
            <div
              aria-hidden
              className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--color-azafran-claro)] text-[22px]"
            >
              🍳
            </div>
            <p className="mt-3 text-[14px]">
              {esHoy
                ? "Todavía no has apuntado nada hoy."
                : "Ese día no apuntaste nada."}
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--color-tenue)]">
              {esHoy
                ? "Empieza por el desayuno, que es el que menos cuesta."
                : "Puedes apuntarlo ahora si te acuerdas."}
            </p>
          </div>
        )}

        {habituales.length > 0 && <Habituales lista={habituales} fecha={dia} />}

        <CopiarDia destino={dia} candidatos={candidatos} />

        <AnadirComida fecha={dia} />
      </section>

      <Navegacion />
    </main>
  );
}
