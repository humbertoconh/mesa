"use client";

import { useState, useTransition } from "react";
import { repetir } from "@/app/hoy/actions";
import type { AlimentoDesglosado } from "@/lib/tipos";

export type Habitual = AlimentoDesglosado & { momento: string; veces: number };

export function Habituales({ lista, fecha }: { lista: Habitual[]; fecha: string }) {
  const [pendiente, empezar] = useTransition();
  const [tocado, setTocado] = useState<string | null>(null);

  if (!lista.length) return null;

  return (
    <div>
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-tenue)]">
        Lo de siempre
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {lista.map((h) => (
          <button
            key={h.nombre}
            onClick={() => {
              setTocado(h.nombre);
              empezar(() => { repetir(h, fecha); });
            }}
            disabled={pendiente}
            className={`rounded-full bg-[var(--color-azafran-claro)] px-3.5 py-2 text-left text-[13px] font-medium text-[#7a5410] ${
              pendiente && tocado === h.nombre ? "opacity-40" : ""
            }`}
          >
            {h.nombre}
            <span className="cifra ml-1.5 text-[11px] opacity-70">
              {Math.round(h.kcal)}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-[var(--color-tenue)]">
        Un toque y se apunta igual que la última vez.
      </p>
    </div>
  );
}
