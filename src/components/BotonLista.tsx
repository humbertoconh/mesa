"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { generarLista } from "@/app/menu/actions";

export function BotonLista({ lunes, dias }: { lunes: string; dias: string[] }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setCargando(true);
    setError(null);
    const r = await generarLista(lunes, dias);
    setCargando(false);
    if (r?.error) return setError(r.error);
    router.push("/compra");
  }

  return (
    <>
      <button
        onClick={generar}
        disabled={cargando}
        className="w-full rounded-xl bg-[var(--color-pino)] px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-50"
      >
        {cargando ? "Sumando ingredientes…" : "Hacer la lista de la compra"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}
    </>
  );
}
