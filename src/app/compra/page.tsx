import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirCasaActiva } from "@/lib/guardia";
import { hoyISO } from "@/lib/objetivo";
import { lunesDe, nombreDia, SECCIONES } from "@/lib/racion";
import { Navegacion } from "@/components/Navegacion";
import { FilaCompra } from "@/components/FilaCompra";
import { AnadirProducto } from "@/components/AnadirProducto";

interface Fila {
  id: string;
  producto: string;
  cantidad: number | null;
  unidad: string | null;
  seccion: string;
  comprado: boolean;
}

export default async function Compra({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { supabase, user } = await exigirCasaActiva();

  const { semana } = await searchParams;
  const lunes = lunesDe(semana ?? hoyISO());

  const { data: productos } = await supabase
    .from("lista_compra")
    .select("id, producto, cantidad, unidad, seccion, comprado")
    .eq("semana", lunes)
    .order("producto")
    .returns<Fila[]>();

  const lista = productos ?? [];
  const porSeccion = new Map<string, Fila[]>();
  lista.forEach((p) => {
    const actual = porSeccion.get(p.seccion) ?? [];
    actual.push(p);
    porSeccion.set(p.seccion, actual);
  });

  const hechos = lista.filter((p) => p.comprado).length;

  return (
    <main className="mx-auto max-w-md pb-28">
      <header className="cabecera">
      <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
        La compra
      </h1>
      <p className="mt-1.5 text-[12.5px] opacity-80">
        Semana del {nombreDia(lunes)}
        {lista.length > 0 && (
          <>
            {" · "}
            <span className="cifra">
              {hechos} de {lista.length}
            </span>
          </>
        )}
      </p>
      </header>

      {!lista.length ? (
        <div className="tarjeta mx-5 mt-8 px-5 py-8 text-center">
          <p className="text-[14px] leading-relaxed">
            La lista se hace sola con los platos del menú.
          </p>
          <Link
            href="/menu"
            className="mt-4 inline-block rounded-lg bg-[var(--color-pino)] px-4 py-2.5 text-[13px] font-medium text-white"
          >
            Ir al menú
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-6 flex flex-col gap-4 px-5">
            {[...porSeccion.entries()].map(([seccion, filas]) => (
              <div key={seccion} className="tarjeta px-4 py-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-naranja)]">
                  {SECCIONES[seccion] ?? seccion}
                </h2>
                <ul className="mt-1 divide-y divide-[var(--color-linea)]">
                  {filas.map((p) => (
                    <FilaCompra key={p.id} {...p} />
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <div className="mt-6 px-5">
            <AnadirProducto semana={lunes} />
          </div>

          <p className="mt-5 px-5 text-[12px] leading-relaxed text-[var(--color-tenue)]">
            Las cantidades ya están sumadas de todos los platos de la semana y
            multiplicadas por los que sois en casa. Si rehaces la lista desde el
            menú, lo que ya esté marcado se queda marcado.
          </p>
        </>
      )}

      <Navegacion />
    </main>
  );
}
