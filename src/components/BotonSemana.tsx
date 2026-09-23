"use client";

import { useState } from "react";
import { proponerSemana } from "@/app/menu/actions";

export function BotonSemana({ dias, vacia }: { dias: string[]; vacia: boolean }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<number | null>(null);

  async function proponer() {
    setCargando(true);
    setError(null);
    setHecho(null);
    const r = await proponerSemana(dias);
    setCargando(false);
    if (r?.error) return setError(r.error);
    setHecho(r?.total ?? 0);
  }

  return (
    <div>
      <button
        onClick={proponer}
        disabled={cargando}
        className={`w-full rounded-xl px-4 py-3.5 text-[15px] font-medium disabled:opacity-50 ${
          vacia
            ? "bg-[var(--color-pino)] text-white"
            : "border border-[var(--color-pino)] text-[var(--color-pino)]"
        }`}
      >
        {cargando
          ? "Montando la semana…"
          : vacia
          ? "Proponer la semana"
          : "Rellenar los huecos que falten"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}
      {hecho !== null && (
        <p className="mt-2 text-[13px] text-[var(--color-pino)]">
          {hecho} {hecho === 1 ? "plato puesto" : "platos puestos"}. Cambia el que
          no te convenza.
        </p>
      )}
    </div>
  );
}
