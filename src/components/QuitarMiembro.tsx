"use client";

import { useState, useTransition } from "react";
import { expulsar } from "@/app/casa/actions";

export function QuitarMiembro({ id, nombre }: { id: string; nombre: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        aria-label={`Sacar a ${nombre} de la casa`}
        className="shrink-0 px-1 text-[17px] leading-none text-[var(--color-tenue)]"
      >
        ×
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-[12px] leading-relaxed text-[var(--color-alarma)]">
        Al sacar a {nombre} se borra también su registro de comidas y su peso.
        No hay vuelta atrás.
      </p>
      {error && <p className="text-[12px] text-[var(--color-alarma)]">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setConfirmando(false)}
          className="flex-1 rounded-lg border border-[var(--color-linea)] px-3 py-2 text-[13px]"
        >
          Dejarlo
        </button>
        <button
          onClick={() =>
            empezar(async () => {
              const r = await expulsar(id);
              if (r?.error) setError(r.error);
            })
          }
          disabled={pendiente}
          className="flex-1 rounded-lg bg-[var(--color-alarma)] px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {pendiente ? "…" : "Sacar de la casa"}
        </button>
      </div>
    </div>
  );
}
