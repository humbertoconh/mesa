"use client";

import { useActionState } from "react";
import { guardarPerfil } from "./actions";

const ACTIVIDADES = [
  { v: 1.2, t: "Poco movimiento", d: "Trabajo sentado, sin ejercicio" },
  { v: 1.4, t: "Algo de movimiento", d: "Camino o entreno un par de días" },
  { v: 1.6, t: "Activo", d: "Trabajo de pie o entreno casi a diario" },
  { v: 1.8, t: "Muy activo", d: "Trabajo físico duro o entreno fuerte" },
];

const METAS = [
  { v: "perder", t: "Perder peso" },
  { v: "mantener", t: "Mantenerme" },
  { v: "ganar", t: "Ganar músculo" },
];

const campo =
  "rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3.5 py-3 text-[15px]";

export default function Perfil() {
  const [error, enviar, pendiente] = useActionState(guardarPerfil, null);

  return (
    <main className="min-h-dvh px-6 py-12 max-w-sm mx-auto">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
        Tus datos
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-tenue)]">
        Con esto se calcula tu objetivo. Nadie más de la casa lo ve.
      </p>

      <form action={enviar} className="mt-8 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Peso (kg)</span>
            <input name="kg" type="number" step="0.1" required className={`${campo} cifra`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Altura (cm)</span>
            <input name="altura_cm" type="number" required className={`${campo} cifra`} />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Fecha de nacimiento</span>
          <input name="nacimiento" type="date" required className={campo} />
        </label>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-[13px] font-medium mb-1.5">Sexo</legend>
          <div className="flex gap-2">
            {[{ v: "h", t: "Hombre" }, { v: "m", t: "Mujer" }].map((o) => (
              <label key={o.v} className="flex-1">
                <input type="radio" name="sexo" value={o.v} required className="peer sr-only" />
                <div className="cursor-pointer rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3 py-3 text-center text-[14px] peer-checked:border-[var(--color-pino)] peer-checked:bg-[var(--color-pino-claro)]">
                  {o.t}
                </div>
              </label>
            ))}
          </div>
          <p className="text-[12px] text-[var(--color-tenue)]">
            La fórmula del metabolismo basal da un resultado distinto según el sexo.
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-[13px] font-medium mb-1.5">Cuánto te mueves</legend>
          {ACTIVIDADES.map((a) => (
            <label key={a.v}>
              <input type="radio" name="actividad" value={a.v} required className="peer sr-only" />
              <div className="cursor-pointer rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3.5 py-3 peer-checked:border-[var(--color-pino)] peer-checked:bg-[var(--color-pino-claro)]">
                <div className="text-[14px] font-medium">{a.t}</div>
                <div className="text-[12px] text-[var(--color-tenue)]">{a.d}</div>
              </div>
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-[13px] font-medium mb-1.5">Qué buscas</legend>
          <div className="flex gap-2">
            {METAS.map((m) => (
              <label key={m.v} className="flex-1">
                <input type="radio" name="meta" value={m.v} required className="peer sr-only" />
                <div className="cursor-pointer rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-2 py-3 text-center text-[13px] peer-checked:border-[var(--color-pino)] peer-checked:bg-[var(--color-pino-claro)]">
                  {m.t}
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-[13px] text-[var(--color-alarma)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pendiente}
          className="rounded-lg bg-[var(--color-pino)] px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {pendiente ? "Calculando…" : "Calcular mi objetivo"}
        </button>
      </form>
    </main>
  );
}
