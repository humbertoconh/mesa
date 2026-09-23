"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BANDAS, ETIQUETAS, REGIONES, TIPOS } from "@/lib/clasificacion";

/**
 * Filtros del recetario. Viajan en la dirección, así que un filtro se
 * puede guardar en favoritos o pasar por WhatsApp y llega igual.
 */
export function Filtros({ cuantas }: { cuantas: number }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  function poner(clave: string, valor: string) {
    const p = new URLSearchParams(params.toString());
    if (p.get(clave) === valor) p.delete(clave);
    else p.set(clave, valor);
    router.push(`${ruta}?${p.toString()}`);
  }

  const activo = (clave: string, valor: string) => params.get(clave) === valor;
  const hayAlguno = ["tipo", "region", "etiqueta", "banda"].some((c) => params.get(c));

  const pastilla = (encendida: boolean, color: string, fondo: string) =>
    `shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
      encendida ? "text-white" : ""
    }`;

  return (
    <div className="mt-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1.5">
        {TIPOS.map((t) => (
          <button
            key={t}
            onClick={() => poner("tipo", t)}
            className={pastilla(activo("tipo", t), "", "")}
            style={
              activo("tipo", t)
                ? { background: "var(--color-pino)", color: "#fff" }
                : { background: "var(--color-pino-claro)", color: "var(--color-pino)" }
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1.5">
        {(Object.keys(BANDAS) as (keyof typeof BANDAS)[]).map((b) => (
          <button
            key={b}
            onClick={() => poner("banda", b)}
            className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium"
            style={
              activo("banda", b)
                ? { background: "var(--color-azulejo)", color: "#fff" }
                : { background: "var(--color-azulejo-claro)", color: "var(--color-azulejo)" }
            }
          >
            {BANDAS[b].texto}
          </button>
        ))}
        {ETIQUETAS.map((e) => (
          <button
            key={e}
            onClick={() => poner("etiqueta", e)}
            className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium"
            style={
              activo("etiqueta", e)
                ? { background: "var(--color-azafran)", color: "#fff" }
                : { background: "var(--color-azafran-claro)", color: "#7a5410" }
            }
          >
            {e}
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <select
          value={params.get("region") ?? ""}
          onChange={(e) => {
            const p = new URLSearchParams(params.toString());
            if (e.target.value) p.set("region", e.target.value);
            else p.delete("region");
            router.push(`${ruta}?${p.toString()}`);
          }}
          className="flex-1 rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3 py-2 text-[13px]"
        >
          <option value="">Toda España</option>
          {REGIONES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {hayAlguno && (
          <button
            onClick={() => router.push(ruta)}
            className="shrink-0 rounded-lg border border-[var(--color-linea)] px-3 py-2 text-[13px] text-[var(--color-tenue)]"
          >
            Quitar filtros
          </button>
        )}
      </div>

      {hayAlguno && (
        <p className="mt-2 text-[12px] text-[var(--color-tenue)]">
          <span className="cifra">{cuantas}</span>{" "}
          {cuantas === 1 ? "receta" : "recetas"} con esos filtros
        </p>
      )}
    </div>
  );
}
