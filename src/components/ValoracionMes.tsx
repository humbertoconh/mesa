"use client";

import { useState } from "react";

interface Consejo {
  que: string;
  porque: string;
}

interface Resumen {
  titulo: string;
  parrafos: string[];
  consejos: Consejo[];
}

export function ValoracionMes({ diasApuntados }: { diasApuntados: number }) {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pocos = diasApuntados < 5;

  async function valorar() {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/resumen", { method: "POST" });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error);
      setResumen(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado.");
    } finally {
      setCargando(false);
    }
  }

  if (resumen) {
    return (
      <section className="tarjeta mx-5 mt-3 px-4 py-4">
        <h2 className="font-[family-name:var(--font-display)] text-[18px] font-semibold leading-tight">
          {resumen.titulo}
        </h2>

        <div className="mt-3 flex flex-col gap-2.5">
          {resumen.parrafos.map((p, i) => (
            <p key={i} className="text-[13.5px] leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        {resumen.consejos.length > 0 && (
          <>
            <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-tenue)]">
              Para el mes que viene
            </h3>
            <ul className="mt-2.5 flex flex-col gap-2.5">
              {resumen.consejos.map((c, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-[var(--color-pino-claro)] px-3.5 py-3"
                >
                  <div className="text-[13.5px] font-semibold text-[var(--color-pino)]">
                    {c.que}
                  </div>
                  <div className="mt-0.5 text-[12.5px] leading-relaxed text-[#3d5a4b]">
                    {c.porque}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          onClick={() => setResumen(null)}
          className="mt-4 text-[13px] text-[var(--color-tenue)] underline underline-offset-4"
        >
          Cerrar
        </button>
      </section>
    );
  }

  return (
    <section className="tarjeta mx-5 mt-3 px-4 py-4">
      <h2 className="text-[14px] font-semibold">Valoración del mes</h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--color-tenue)]">
        {pocos
          ? "Con cinco días apuntados o más se puede sacar algo en claro. Ahora mismo no hay bastante."
          : "Una lectura de tus números del último mes, con un par de cosas concretas que probar."}
      </p>

      {error && (
        <p role="alert" className="mt-2.5 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}

      <button
        onClick={valorar}
        disabled={cargando || pocos}
        className="mt-3 w-full rounded-xl bg-[var(--color-pino)] px-4 py-3 text-[14px] font-medium text-white disabled:opacity-50"
      >
        {cargando ? "Mirando tus números…" : "Valorar el mes"}
      </button>
    </section>
  );
}
