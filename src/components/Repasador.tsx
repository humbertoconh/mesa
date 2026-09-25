"use client";

import Link from "next/link";
import { useRef, useState } from "react";

interface Receta {
  id: string;
  nombre: string;
  etiquetas: string[] | null;
  region: string | null;
}

type Estado = "espera" | "haciendo" | "hecha" | "fallo";

interface Fila {
  id: string;
  nombre: string;
  estado: Estado;
  detalle?: string;
}

export function Repasador({ recetas }: { recetas: Receta[] }) {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [enMarcha, setEnMarcha] = useState(false);
  const [soloVacias, setSoloVacias] = useState(true);
  const parar = useRef(false);

  const sinClasificar = recetas.filter(
    (r) => !r.region || !r.etiquetas?.length
  );
  const objetivo = soloVacias ? sinClasificar : recetas;

  async function empezar() {
    parar.current = false;
    setEnMarcha(true);
    setFilas(objetivo.map((r) => ({ id: r.id, nombre: r.nombre, estado: "espera" })));

    for (let i = 0; i < objetivo.length; i++) {
      if (parar.current) break;
      setFilas((f) => f.map((x, j) => (j === i ? { ...x, estado: "haciendo" } : x)));

      try {
        const r = await fetch("/api/reclasificar", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: objetivo[i].id }),
        });
        const datos = await r.json();
        if (!r.ok) throw new Error(datos.error);

        setFilas((f) =>
          f.map((x, j) =>
            j === i
              ? {
                  ...x,
                  estado: "hecha",
                  detalle: [datos.region, datos.tipo, ...(datos.etiquetas ?? [])]
                    .filter(Boolean)
                    .join(" · "),
                }
              : x
          )
        );
      } catch (e) {
        setFilas((f) =>
          f.map((x, j) =>
            j === i
              ? { ...x, estado: "fallo", detalle: e instanceof Error ? e.message : "falló" }
              : x
          )
        );
      }

      await new Promise((res) => setTimeout(res, 600));
    }

    setEnMarcha(false);
  }

  const hechas = filas.filter((f) => f.estado === "hecha").length;

  return (
    <div className="px-5">
      {!filas.length ? (
        <>
          <div className="tarjeta mt-6 px-4 py-4">
            <p className="text-[14px] leading-relaxed">
              Repasa la clasificación con la IA: de dónde es el plato, qué es,
              temporada, dificultad y etiquetas.
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-tenue)]">
              Útil para las recetas que metiste antes de que existieran las
              etiquetas, o si has añadido etiquetas nuevas.
            </p>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--color-pino-claro)] px-4 py-3">
            <input
              type="checkbox"
              checked={soloVacias}
              onChange={(e) => setSoloVacias(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-pino)]"
            />
            <span>
              <span className="block text-[13.5px] font-semibold text-[var(--color-pino)]">
                Sólo las que están sin clasificar
              </span>
              <span className="mt-0.5 block text-[12px] text-[var(--color-tenue)]">
                {sinClasificar.length} de {recetas.length}. Si lo desmarcas se
                repasan todas y se pisa lo que hayas puesto a mano.
              </span>
            </span>
          </label>

          <button
            onClick={empezar}
            disabled={!objetivo.length}
            className="mt-4 w-full rounded-xl bg-[var(--color-naranja)] px-4 py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {objetivo.length
              ? `Repasar ${objetivo.length} ${objetivo.length === 1 ? "receta" : "recetas"}`
              : "No hay nada que repasar"}
          </button>
        </>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[13px]">
              <span className="cifra font-semibold">{hechas}</span> de{" "}
              <span className="cifra">{filas.length}</span>
            </p>
            {enMarcha ? (
              <button
                onClick={() => (parar.current = true)}
                className="rounded-lg border border-[var(--color-linea)] px-3 py-1.5 text-[13px]"
              >
                Parar
              </button>
            ) : (
              <Link
                href="/recetas"
                className="rounded-lg bg-[var(--color-pino)] px-3.5 py-2 text-[13px] font-semibold text-white"
              >
                Ver recetario
              </Link>
            )}
          </div>

          <ul className="mt-4 flex flex-col gap-1.5">
            {filas.map((f) => (
              <li key={f.id} className="tarjeta flex items-start gap-3 px-3.5 py-2.5">
                <span
                  aria-hidden
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
                    f.estado === "hecha"
                      ? "bg-[var(--color-pino-claro)] text-[var(--color-pino)]"
                      : f.estado === "fallo"
                      ? "bg-[#fbe3e0] text-[var(--color-alarma)]"
                      : f.estado === "haciendo"
                      ? "bg-[var(--color-azafran-claro)] text-[#7a5410]"
                      : "bg-[#f1ece3] text-[var(--color-tenue)]"
                  }`}
                >
                  {f.estado === "hecha" ? "✓" : f.estado === "fallo" ? "!" : "·"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px]">{f.nombre}</span>
                  {f.detalle && (
                    <span className="block text-[11px] leading-snug text-[var(--color-tenue)]">
                      {f.detalle}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-8">
        <Link href="/recetas" className="text-[13px] text-[var(--color-tenue)] underline underline-offset-4">
          ← Recetario
        </Link>
      </div>
    </div>
  );
}
