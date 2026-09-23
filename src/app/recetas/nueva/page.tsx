"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { guardarReceta, type RecetaIA } from "../actions";
import { SECCIONES } from "@/lib/racion";

export default function NuevaReceta() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [receta, setReceta] = useState<RecetaIA | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function leer() {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/receta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error);
      setReceta(datos.receta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado.");
    } finally {
      setCargando(false);
    }
  }

  async function guardar() {
    if (!receta) return;
    setCargando(true);
    const r = await guardarReceta(receta);
    setCargando(false);
    if (r?.error) return setError(r.error);
    router.push("/recetas");
  }

  const kcalTotal =
    receta?.ingredientes.reduce(
      (s, i) => s + (i.gramos * i.kcal_100) / 100, 0
    ) ?? 0;

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-10">
      <Link href="/recetas" className="text-[13px] text-[var(--color-tenue)]">
        ← Recetas
      </Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-[26px] font-semibold leading-tight">
        Nueva receta
      </h1>

      {!receta ? (
        <>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-tenue)]">
            Pégala como la tengas: una lista, un párrafo, o sólo el nombre del
            plato si es de los de toda la vida.
          </p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            autoFocus
            placeholder={"Arroz al horno para 4\n\n400 g de arroz bomba, un bote de garbanzos, dos patatas, morcilla, panceta, un tomate, ajo, azafrán y caldo de cocido."}
            className="mt-4 w-full resize-none rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3.5 text-[15px] leading-relaxed"
          />
          {error && (
            <p role="alert" className="mt-3 text-[13px] text-[var(--color-alarma)]">
              {error}
            </p>
          )}
          <button
            onClick={leer}
            disabled={cargando || texto.trim().length < 3}
            className="mt-4 w-full rounded-xl bg-[var(--color-pino)] px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-50"
          >
            {cargando ? "Leyendo la receta…" : "Leer receta"}
          </button>
        </>
      ) : (
        <>
          <input
            value={receta.nombre}
            onChange={(e) => setReceta({ ...receta, nombre: e.target.value })}
            className="mt-4 w-full rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3 text-[16px] font-medium"
          />

          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-[13px]">
              Para
              <input
                type="number"
                min={1}
                max={20}
                value={receta.raciones}
                onChange={(e) =>
                  setReceta({ ...receta, raciones: Number(e.target.value) || 1 })
                }
                className="cifra w-16 rounded-lg border border-[var(--color-linea)] px-2.5 py-2 text-center"
              />
              personas
            </label>
            <span className="cifra text-[13px] text-[var(--color-tenue)]">
              {Math.round(kcalTotal / receta.raciones)} kcal por ración
            </span>
          </div>

          <h2 className="mt-6 text-[13px] font-medium">Ingredientes</h2>
          <ul className="mt-2 divide-y divide-[var(--color-linea)] rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4">
            {receta.ingredientes.map((ing, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <div className="flex-1">
                  <div className="text-[14px]">{ing.nombre}</div>
                  <div className="text-[11px] text-[var(--color-tenue)]">
                    {SECCIONES[ing.seccion] ?? ing.seccion} ·{" "}
                    <span className="cifra">
                      {Math.round((ing.gramos * ing.kcal_100) / 100)} kcal
                    </span>
                  </div>
                </div>
                <input
                  type="number"
                  value={ing.gramos}
                  onChange={(e) => {
                    const copia = [...receta.ingredientes];
                    copia[i] = { ...ing, gramos: Number(e.target.value) || 0 };
                    setReceta({ ...receta, ingredientes: copia });
                  }}
                  className="cifra w-20 rounded-lg border border-[var(--color-linea)] px-2 py-1.5 text-right text-[13px]"
                />
                <span className="text-[12px] text-[var(--color-tenue)]">g</span>
                <button
                  onClick={() =>
                    setReceta({
                      ...receta,
                      ingredientes: receta.ingredientes.filter((_, j) => j !== i),
                    })
                  }
                  aria-label={`Quitar ${ing.nombre}`}
                  className="text-[18px] leading-none text-[var(--color-tenue)]"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-tenue)]">
            Corrige los gramos si no cuadran. Lo que guardes aquí es lo que
            luego saldrá en la lista de la compra.
          </p>

          {receta.pasos.length > 0 && (
            <>
              <h2 className="mt-6 text-[13px] font-medium">Pasos</h2>
              <ol className="mt-2 flex flex-col gap-2">
                {receta.pasos.map((paso, i) => (
                  <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                    <span className="cifra shrink-0 text-[var(--color-tenue)]">
                      {i + 1}
                    </span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {error && (
            <p role="alert" className="mt-4 text-[13px] text-[var(--color-alarma)]">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setReceta(null)}
              className="rounded-xl border border-[var(--color-linea)] px-4 py-3 text-[14px]"
            >
              Volver
            </button>
            <button
              onClick={guardar}
              disabled={cargando}
              className="flex-1 rounded-xl bg-[var(--color-pino)] px-4 py-3 text-[15px] font-medium text-white disabled:opacity-50"
            >
              {cargando ? "Guardando…" : "Guardar receta"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
