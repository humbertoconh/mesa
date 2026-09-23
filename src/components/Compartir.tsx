"use client";

import { useState, useTransition } from "react";
import { compartir } from "@/app/recetas/actions";

export function Compartir({
  id,
  publica,
  veces,
}: {
  id: string;
  publica: boolean;
  veces: number;
}) {
  const [activo, setActivo] = useState(publica);
  const [pendiente, empezar] = useTransition();

  return (
    <div className="tarjeta mt-6 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-[14px] font-semibold">Compartir con otras casas</div>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-tenue)]">
            {activo
              ? "Cualquiera que use Mesa puede verla y copiarla a su casa."
              : "Ahora mismo sólo la ve tu casa."}
          </p>
          {activo && veces > 0 && (
            <p className="mt-1.5 text-[12px] font-medium text-[var(--color-pino)]">
              La han copiado {veces} {veces === 1 ? "vez" : "veces"}
            </p>
          )}
        </div>

        <button
          role="switch"
          aria-checked={activo}
          aria-label="Compartir esta receta"
          disabled={pendiente}
          onClick={() => {
            const nuevo = !activo;
            setActivo(nuevo);
            empezar(() => { compartir(id, nuevo); });
          }}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            activo ? "bg-[var(--color-pino)]" : "bg-[var(--color-linea)]"
          } ${pendiente ? "opacity-60" : ""}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
              activo ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
