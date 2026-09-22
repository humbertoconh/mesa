"use client";

import { useTransition } from "react";
import { borrarRegistro } from "@/app/hoy/actions";
import type { Registro } from "@/lib/tipos";

export function FilaRegistro({ r }: { r: Registro }) {
  const [pendiente, empezar] = useTransition();

  return (
    <li
      className={`flex items-baseline justify-between gap-3 py-2.5 ${
        pendiente ? "opacity-40" : ""
      }`}
    >
      <div>
        <div className="text-[14px]">{r.descripcion}</div>
        {r.gramos && (
          <div className="cifra text-[12px] text-[var(--color-tenue)]">{r.gramos} g</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="cifra text-[13px]">{Math.round(r.kcal)}</span>
        <button
          onClick={() => empezar(() => { borrarRegistro(r.id); })}
          disabled={pendiente}
          aria-label={`Quitar ${r.descripcion}`}
          className="text-[18px] leading-none text-[var(--color-tenue)]"
        >
          ×
        </button>
      </div>
    </li>
  );
}
