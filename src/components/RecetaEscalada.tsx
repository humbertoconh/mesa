"use client";

import { useState } from "react";
import { SECCIONES } from "@/lib/racion";

interface Ingrediente {
  nombre: string;
  gramos: number;
  seccion: string;
  kcal_100: number;
}

interface Props {
  ingredientes: Ingrediente[];
  racionesBase: number;
  comensales: number;
}

function cantidad(gramos: number) {
  if (gramos >= 1000) return `${(gramos / 1000).toFixed(1).replace(".", ",")} kg`;
  if (gramos < 10) return `${gramos.toFixed(1).replace(".", ",")} g`;
  return `${Math.round(gramos)} g`;
}

export function RecetaEscalada({ ingredientes, racionesBase, comensales }: Props) {
  const [raciones, setRaciones] = useState(comensales);
  const factor = raciones / racionesBase;

  const kcalTotal = ingredientes.reduce(
    (s, i) => s + (i.gramos * i.kcal_100) / 100, 0
  );

  return (
    <>
      <div className="mt-5 flex items-center gap-3 rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3">
        <span className="text-[13px]">Para</span>
        <button
          onClick={() => setRaciones(Math.max(1, raciones - 1))}
          aria-label="Una ración menos"
          className="h-8 w-8 rounded-lg border border-[var(--color-linea)] text-[16px]"
        >
          −
        </button>
        <span className="cifra w-6 text-center text-[16px] font-medium">{raciones}</span>
        <button
          onClick={() => setRaciones(Math.min(20, raciones + 1))}
          aria-label="Una ración más"
          className="h-8 w-8 rounded-lg border border-[var(--color-linea)] text-[16px]"
        >
          +
        </button>
        <span className="text-[13px]">personas</span>
        <span className="cifra ml-auto text-[12px] text-[var(--color-tenue)]">
          {Math.round(kcalTotal / racionesBase)} kcal/ración
        </span>
      </div>

      <h2 className="mt-6 text-[13px] font-medium">Ingredientes</h2>
      <ul className="mt-2 divide-y divide-[var(--color-linea)] rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4">
        {ingredientes.map((i, n) => (
          <li key={n} className="flex items-baseline justify-between gap-3 py-2.5">
            <div>
              <div className="text-[14px]">{i.nombre}</div>
              <div className="text-[11px] text-[var(--color-tenue)]">
                {SECCIONES[i.seccion] ?? i.seccion}
              </div>
            </div>
            <span className="cifra shrink-0 text-[13px] font-medium">
              {cantidad(i.gramos * factor)}
            </span>
          </li>
        ))}
      </ul>

      {raciones !== racionesBase && (
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-tenue)]">
          Cantidades ajustadas de {racionesBase} a {raciones}. La sal y las
          especias no escalan bien: ve probando.
        </p>
      )}
    </>
  );
}
