"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { copiarReceta } from "@/app/recetas/actions";

export function BotonCopiar({ id }: { id: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        onClick={async () => {
          setCargando(true);
          setError(null);
          const r = await copiarReceta(id);
          setCargando(false);
          if (r?.error) return setError(r.error);
          router.push(`/recetas/${r.id}`);
        }}
        disabled={cargando}
        className="shrink-0 rounded-full bg-[var(--color-naranja)] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
      >
        {cargando ? "…" : "Copiar"}
      </button>
      {error && (
        <p role="alert" className="mt-1 w-full text-[12px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}
    </>
  );
}
