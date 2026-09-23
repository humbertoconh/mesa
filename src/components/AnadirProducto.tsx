"use client";

import { useActionState, useRef } from "react";
import { anadirAMano } from "@/app/compra/actions";

export function AnadirProducto({ semana }: { semana: string }) {
  const [error, enviar] = useActionState(anadirAMano, null);
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (datos) => {
        await enviar(datos);
        ref.current?.reset();
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="semana" value={semana} />
      <input
        name="producto"
        placeholder="Añadir algo más (papel, leche…)"
        className="flex-1 rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3.5 py-2.5 text-[14px]"
      />
      <button className="rounded-lg border border-[var(--color-pino)] px-3.5 py-2.5 text-[14px] text-[var(--color-pino)]">
        Añadir
      </button>
      {error && (
        <p role="alert" className="text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}
    </form>
  );
}
