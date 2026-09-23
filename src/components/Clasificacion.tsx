"use client";

import {
  DIFICULTADES, ETIQUETAS, REGIONES, TEMPORADAS, TIPOS,
} from "@/lib/clasificacion";

export interface ValorClasificacion {
  region: string;
  tipo: string;
  temporada: string;
  dificultad: string;
  etiquetas: string[];
}

const campo =
  "rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3 py-2.5 text-[14px]";

export function Clasificacion({
  valor,
  alCambiar,
}: {
  valor: ValorClasificacion;
  alCambiar: (v: ValorClasificacion) => void;
}) {
  const set = (parte: Partial<ValorClasificacion>) =>
    alCambiar({ ...valor, ...parte });

  return (
    <>
      <div className="mt-3 flex flex-col gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-[var(--color-tenue)]">De dónde es</span>
          <select
            value={valor.region}
            onChange={(e) => set({ region: e.target.value })}
            className={campo}
          >
            <option value="">Sin especificar</option>
            {REGIONES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-[var(--color-tenue)]">Qué es</span>
            <select
              value={valor.tipo}
              onChange={(e) => set({ tipo: e.target.value })}
              className={campo}
            >
              <option value="">Sin especificar</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-[var(--color-tenue)]">Cuándo apetece</span>
            <select
              value={valor.temporada}
              onChange={(e) => set({ temporada: e.target.value })}
              className={campo}
            >
              {TEMPORADAS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-[var(--color-tenue)]">Cuánta mano pide</span>
          <select
            value={valor.dificultad}
            onChange={(e) => set({ dificultad: e.target.value })}
            className={campo}
          >
            <option value="">Sin especificar</option>
            {DIFICULTADES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>

      <h2 className="mt-5 text-[13px] font-medium">Etiquetas</h2>
      <p className="mt-1 text-[12px] text-[var(--color-tenue)]">
        Toca para poner o quitar. {valor.etiquetas.length} puestas.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {ETIQUETAS.map((e) => {
          const puesta = valor.etiquetas.includes(e);
          return (
            <button
              key={e}
              type="button"
              onClick={() =>
                set({
                  etiquetas: puesta
                    ? valor.etiquetas.filter((x) => x !== e)
                    : [...valor.etiquetas, e],
                })
              }
              aria-pressed={puesta}
              className="rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={
                puesta
                  ? { background: "var(--color-azafran)", color: "#fff" }
                  : { background: "var(--color-azafran-claro)", color: "#7a5410" }
              }
            >
              {e}
            </button>
          );
        })}
      </div>
    </>
  );
}
