"use client";

import { useOptimistic, useTransition } from "react";
import { marcar } from "@/app/compra/actions";

interface Props {
  id: string;
  producto: string;
  cantidad: number | null;
  unidad: string | null;
  comprado: boolean;
}

/** Cantidades legibles: 1.200 g en el súper se piensa como 1,2 kg. */
function bonito(cantidad: number | null, unidad: string | null) {
  if (!cantidad) return null;
  if (unidad === "g" && cantidad >= 1000) {
    return `${(cantidad / 1000).toFixed(1).replace(".", ",")} kg`;
  }
  return `${Math.round(cantidad)} ${unidad ?? ""}`.trim();
}

export function FilaCompra({ id, producto, cantidad, unidad, comprado }: Props) {
  const [, empezar] = useTransition();
  const [optimista, setOptimista] = useOptimistic(comprado);

  const texto = bonito(cantidad, unidad);

  return (
    <li>
      <button
        onClick={() =>
          empezar(() => {
            setOptimista(!optimista);
            marcar(id, !optimista);
          })
        }
        className="flex w-full items-center gap-3 py-2.5 text-left"
      >
        <span
          aria-hidden
          className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded border text-[11px] text-white ${
            optimista
              ? "border-[var(--color-pino)] bg-[var(--color-pino)]"
              : "border-[var(--color-linea)]"
          }`}
        >
          {optimista ? "✓" : ""}
        </span>
        <span
          className={`flex-1 text-[14px] ${
            optimista ? "text-[var(--color-tenue)] line-through" : ""
          }`}
        >
          {producto}
        </span>
        {texto && (
          <span className="cifra shrink-0 text-[12px] text-[var(--color-tenue)]">
            {texto}
          </span>
        )}
      </button>
    </li>
  );
}
