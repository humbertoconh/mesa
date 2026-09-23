"use client";

import { useOptimistic, useTransition } from "react";
import { ponerAgua } from "@/app/progreso/actions";

const META = 8;

export function Agua({ vasos }: { vasos: number }) {
  const [, empezar] = useTransition();
  const [ahora, setAhora] = useOptimistic(vasos);

  function cambiar(n: number) {
    const nuevo = Math.min(Math.max(n, 0), 20);
    empezar(() => {
      setAhora(nuevo);
      ponerAgua(nuevo);
    });
  }

  return (
    <div className="tarjeta px-4 py-3.5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-medium">Agua</h2>
        <span className="cifra text-[13px] text-[var(--color-tenue)]">
          {ahora} {ahora === 1 ? "vaso" : "vasos"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {Array.from({ length: Math.max(META, ahora) }, (_, i) => {
          const lleno = i < ahora;
          return (
            <button
              key={i}
              onClick={() => cambiar(lleno && i === ahora - 1 ? i : i + 1)}
              aria-label={`${i + 1} ${i === 0 ? "vaso" : "vasos"}`}
              className="h-9 w-7 rounded-md border transition-colors"
              style={{
                background: lleno ? "var(--color-azulejo)" : "var(--color-azulejo-claro)",
                borderColor: lleno ? "var(--color-azulejo)" : "var(--color-linea)",
              }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => cambiar(ahora + 1)}
          className="flex-1 rounded-lg bg-[var(--color-azulejo)] px-4 py-2.5 text-[14px] font-medium text-white"
        >
          + Un vaso
        </button>
        {ahora > 0 && (
          <button
            onClick={() => cambiar(ahora - 1)}
            aria-label="Quitar un vaso"
            className="rounded-lg border border-[var(--color-linea)] px-4 py-2.5 text-[14px]"
          >
            −
          </button>
        )}
      </div>

      <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--color-tenue)]">
        {ahora >= META
          ? "Por hoy vas servido."
          : `Ocho vasos es la referencia de toda la vida. Te faltan ${META - ahora}.`}
      </p>
    </div>
  );
}
