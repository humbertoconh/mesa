"use client";

import { useState } from "react";

export function CodigoCasa({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: que lo copie a mano, se ve en pantalla.
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-pino)] bg-[var(--color-pino-claro)] px-4 py-4">
      <div className="text-[13px] font-medium text-[var(--color-pino)]">
        Código para invitar
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="cifra font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-[0.18em] text-[var(--color-pino)]">
          {codigo}
        </span>
        <button
          onClick={copiar}
          className="rounded-lg border border-[var(--color-pino)] px-3 py-2 text-[13px] text-[var(--color-pino)]"
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="mt-2.5 text-[12px] leading-relaxed text-[var(--color-tenue)]">
        Quien lo tenga entra en la casa: que se cree su cuenta y elija
        &laquo;Tengo código&raquo;.
      </p>
    </div>
  );
}
