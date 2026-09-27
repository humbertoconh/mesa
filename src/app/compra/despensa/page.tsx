import Link from "next/link";
import { exigirCasaActiva } from "@/lib/guardia";
import { BASICOS_SUGERIDOS, clave } from "@/lib/despensa";
import { Despensa } from "@/components/Despensa";
import { Navegacion } from "@/components/Navegacion";

export default async function PaginaDespensa() {
  const { supabase } = await exigirCasaActiva();

  const { data: dentro } = await supabase
    .from("despensa")
    .select("clave, nombre")
    .order("nombre");

  // Lo que más ha salido en las listas: los mejores candidatos.
  const { data: productos } = await supabase
    .from("lista_compra")
    .select("producto, cantidad")
    .limit(400);

  const veces = new Map<string, { nombre: string; n: number }>();
  (productos ?? []).forEach((p) => {
    const k = clave(p.producto);
    const a = veces.get(k) ?? { nombre: p.producto, n: 0 };
    a.n++;
    veces.set(k, a);
  });

  const yaDentro = new Set((dentro ?? []).map((d) => d.clave));
  const sugeridosPropios = [...veces.entries()]
    .filter(([k]) => !yaDentro.has(k))
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 14)
    .map(([, v]) => v.nombre);

  return (
    <main className="mx-auto max-w-md pb-28">
      <header className="cabecera">
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
          La despensa
        </h1>
        <p className="mt-1.5 text-[12.5px] opacity-80">
          Lo que siempre hay en casa y no se compra cada semana.
        </p>
      </header>

      <div className="px-5">
        <Despensa
          dentro={dentro ?? []}
          sugeridos={BASICOS_SUGERIDOS.filter((b) => !yaDentro.has(clave(b)))}
          deTusListas={sugeridosPropios}
        />

        <div className="mt-9">
          <Link href="/compra" className="text-[13px] text-[var(--color-tenue)] underline underline-offset-4">
            ← La compra
          </Link>
        </div>
      </div>

      <Navegacion />
    </main>
  );
}
