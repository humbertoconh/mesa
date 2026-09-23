"use client";

import { useState, useTransition } from "react";
import { borrarReceta } from "@/app/recetas/actions";

export function BorrarReceta({ id, nombre }: { id: string; nombre: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, empezar] = useTransition();

  if (confirmando) {
    return (
      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={() => setConfirmando(false)}
          className="rounded-lg border border-[var(--color-linea)] px-2.5 py-1.5 text-[12px]"
        >
          No
        </button>
        <button
          onClick={() => empezar(() => { borrarReceta(id); })}
          disabled={pendiente}
          className="rounded-lg bg-[var(--color-alarma)] px-2.5 py-1.5 text-[12px] text-white"
        >
          Borrar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      aria-label={`Borrar ${nombre}`}
      className="shrink-0 px-1 text-[18px] leading-none text-[var(--color-tenue)]"
    >
      ×
    </button>
  );
}
