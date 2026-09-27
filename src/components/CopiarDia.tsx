"use client";

import { useState, useTransition } from "react";
import { copiarDia } from "@/app/hoy/actions";

export interface DiaCandidato {
  fecha: string;
  kcal: number;
  platos: number;
}

export function CopiarDia({
  destino,
  candidatos,
}: {
  destino: string;
  candidatos: DiaCandidato[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!candidatos.length) return null;

  const nombre = (f: string) =>
    new Date(f + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3 text-[14px]"
      >
        Copiar lo de otro día
      </button>
    );
  }

  return (
    <div className="tarjeta px-4 py-4">
      <h2 className="text-[14px] font-semibold">¿De qué día?</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-tenue)]">
        Se copia todo lo de ese día y se suma a lo que ya tengas aquí.
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {candidatos.map((c) => (
          <li key={c.fecha}>
            <button
              onClick={() =>
                empezar(async () => {
                  const r = await copiarDia(c.fecha, destino);
                  if (r?.error) setError(r.error);
                  else setAbierto(false);
                })
              }
              disabled={pendiente}
              className="flex w-full items-center justify-between rounded-xl border border-[var(--color-linea)] px-3.5 py-2.5 text-left"
            >
              <span className="text-[14px] capitalize">{nombre(c.fecha)}</span>
              <span className="cifra text-[12px] text-[var(--color-tenue)]">
                {c.platos} · {Math.round(c.kcal).toLocaleString("es-ES")} kcal
              </span>
            </button>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="mt-2.5 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}

      <button
        onClick={() => setAbierto(false)}
        className="mt-3 w-full rounded-lg border border-[var(--color-linea)] px-4 py-2.5 text-[14px]"
      >
        Cancelar
      </button>
    </div>
  );
}
