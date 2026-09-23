"use client";

import { useState, useTransition } from "react";
import { apuntarDelMenu } from "@/app/hoy/actions";
import { Miniatura } from "@/components/Miniatura";
import type { Momento } from "@/lib/objetivo";

interface Props {
  fecha: string;
  momento: Momento;
  nombre: string;
  foto: string | null;
  racion: { gramos: number; kcal: number };
  yaApuntado: boolean;
}

export function PlatoDeHoy({ fecha, momento, nombre, foto, racion, yaApuntado }: Props) {
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <article
      className={`tarjeta px-3.5 py-3 ${
        yaApuntado ? "opacity-70" : "ring-2 ring-[var(--color-lima)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <Miniatura nombre={nombre} foto={foto} />
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-[var(--color-tenue)]">
            Hoy de {momento}
          </div>
          <div className="mt-0.5 text-[14px] font-medium">{nombre}</div>
          <div className="cifra mt-0.5 text-[12px] text-[var(--color-tenue)]">
            tu ración: {racion.gramos} g · {racion.kcal} kcal
          </div>
        </div>

        {yaApuntado ? (
          <span className="shrink-0 text-[12px] text-[var(--color-tenue)]">
            apuntado
          </span>
        ) : (
          <button
            onClick={() =>
              empezar(async () => {
                const r = await apuntarDelMenu(fecha, momento);
                if (r?.error) setError(r.error);
              })
            }
            disabled={pendiente}
            className="shrink-0 rounded-lg bg-[var(--color-pino)] px-3.5 py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {pendiente ? "…" : "Apuntar"}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}
    </article>
  );
}
