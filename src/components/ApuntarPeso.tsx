"use client";

import { useActionState, useEffect, useState } from "react";
import { guardarPeso } from "@/app/progreso/actions";

export function ApuntarPeso({ ultimo }: { ultimo: number | null }) {
  const [abierto, setAbierto] = useState(false);
  const [error, enviar, pendiente] = useActionState(guardarPeso, null);

  // Si la acción termina sin error, cerramos el formulario.
  useEffect(() => {
    if (!pendiente && error === null && abierto) {
      const t = setTimeout(() => setAbierto(false), 100);
      return () => clearTimeout(t);
    }
  }, [pendiente]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full rounded-xl bg-[var(--color-pino)] px-4 py-3.5 text-[14px] font-medium text-white"
      >
        Apuntar mi peso de hoy
      </button>
    );
  }

  return (
    <form
      action={enviar}
      className="rounded-xl border border-[var(--color-pino)] bg-[var(--color-loza)] p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Peso (kg)</span>
          <input
            name="kg"
            type="number"
            step="0.1"
            required
            autoFocus
            defaultValue={ultimo ?? undefined}
            className="cifra rounded-lg border border-[var(--color-linea)] px-3.5 py-3 text-[15px]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Cintura (cm)</span>
          <input
            name="cintura_cm"
            type="number"
            step="0.5"
            className="cifra rounded-lg border border-[var(--color-linea)] px-3.5 py-3 text-[15px]"
          />
        </label>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-tenue)]">
        Pésate siempre igual: al levantarte, antes de desayunar. Si no, lo que
        ves es el agua que llevas encima, no lo que has perdido.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-lg border border-[var(--color-linea)] px-4 py-2.5 text-[14px]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pendiente}
          className="flex-1 rounded-lg bg-[var(--color-pino)] px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
        >
          {pendiente ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
