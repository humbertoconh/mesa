import Link from "next/link";
import { exigirCasaActiva } from "@/lib/guardia";
import { hoyISO } from "@/lib/objetivo";
import { diasDeSemana, lunesDe, nombreDia, SECCIONES } from "@/lib/racion";

interface Puesto {
  fecha: string;
  momento: string;
  recetas: { nombre: string; minutos: number | null } | null;
}

interface Compra {
  producto: string;
  cantidad: number | null;
  unidad: string | null;
  seccion: string;
}

function cantidad(c: number | null, u: string | null) {
  if (!c) return "";
  if (u === "g" && c >= 1000) return `${(c / 1000).toFixed(1).replace(".", ",")} kg`;
  return `${Math.round(c)} ${u ?? ""}`.trim();
}

export default async function Imprimir({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { supabase } = await exigirCasaActiva();
  const { semana } = await searchParams;
  const lunes = lunesDe(semana ?? hoyISO());
  const dias = diasDeSemana(lunes);

  const { data: hogar } = await supabase.from("hogares").select("nombre").maybeSingle();

  const { data: puestos } = await supabase
    .from("menu_semanal")
    .select("fecha, momento, recetas(nombre, minutos)")
    .in("fecha", dias)
    .returns<Puesto[]>();

  const { data: compra } = await supabase
    .from("lista_compra")
    .select("producto, cantidad, unidad, seccion")
    .eq("semana", lunes)
    .eq("comprado", false)
    .order("producto")
    .returns<Compra[]>();

  const plato = (fecha: string, momento: string) =>
    (puestos ?? []).find((p) => p.fecha === fecha && p.momento === momento)?.recetas ?? null;

  const porSeccion = new Map<string, Compra[]>();
  (compra ?? []).forEach((p) => {
    const a = porSeccion.get(p.seccion) ?? [];
    a.push(p);
    porSeccion.set(p.seccion, a);
  });

  const finDeSemana = new Date(dias[6] + "T12:00:00").toLocaleDateString("es-ES", {
    day: "numeric", month: "long",
  });

  return (
    <>
      {/* Barra que desaparece al imprimir */}
      <div className="no-imprimir mx-auto flex max-w-md items-center justify-between px-5 py-4">
        <Link href="/menu" className="text-[13px] text-[var(--color-tenue)]">
          ← Menú
        </Link>
        <p className="text-[12px] text-[var(--color-tenue)]">
          Imprime o guarda en PDF desde el navegador
        </p>
      </div>

      <div className="hoja">
        <header className="cabeza">
          <div>
            <h1>Esta semana en casa</h1>
            <p className="sub">
              {hogar?.nombre ? `${hogar.nombre} · ` : ""}
              del {nombreDia(lunes)} al {finDeSemana}
            </p>
          </div>
        </header>

        <table className="semana">
          <thead>
            <tr>
              <th className="dia">Día</th>
              <th>Comida</th>
              <th>Cena</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((f) => {
              const c = plato(f, "comida");
              const ce = plato(f, "cena");
              return (
                <tr key={f}>
                  <td className="dia">{nombreDia(f)}</td>
                  <td>{c?.nombre ?? <span className="vacio">—</span>}</td>
                  <td>{ce?.nombre ?? <span className="vacio">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {porSeccion.size > 0 && (
          <>
            <h2 className="titulo-compra">Lo que falta comprar</h2>
            <div className="compra">
              {[...porSeccion.entries()].map(([sec, filas]) => (
                <div key={sec} className="seccion">
                  <h3>{SECCIONES[sec] ?? sec}</h3>
                  <ul>
                    {filas.map((p, i) => (
                      <li key={i}>
                        <span className="casilla" />
                        {p.producto}
                        {cantidad(p.cantidad, p.unidad) && (
                          <span className="cant"> · {cantidad(p.cantidad, p.unidad)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="pie">Mesa · lo que come la casa, contado entre todos</p>
      </div>
    </>
  );
}
