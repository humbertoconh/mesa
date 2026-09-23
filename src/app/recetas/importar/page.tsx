"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { guardarReceta, type RecetaIA } from "../actions";

const CLASICOS = `Fabada asturiana
Pulpo a feira
Marmitako
Cocido madrileño
Gazpacho andaluz
Salmorejo cordobés
Pisto manchego
Escalivada
Fideuà
Arroz al horno
Lentejas estofadas
Tortilla de patata
Merluza en salsa verde
Bacalao al pil pil
Pollo al ajillo
Albóndigas en salsa
Crema de calabaza
Sopa de picadillo
Ensaladilla rusa
Papas arrugadas con mojo`;

type Estado = "espera" | "haciendo" | "hecha" | "fallo";

interface Fila {
  nombre: string;
  estado: Estado;
  detalle?: string;
}

export default function Importar() {
  const [texto, setTexto] = useState("");
  const [filas, setFilas] = useState<Fila[]>([]);
  const [enMarcha, setEnMarcha] = useState(false);
  const [compartir, setCompartir] = useState(true);
  const parar = useRef(false);

  async function empezar() {
    const nombres = texto
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, 40);

    if (!nombres.length) return;

    parar.current = false;
    setEnMarcha(true);
    const inicial: Fila[] = nombres.map((nombre) => ({ nombre, estado: "espera" }));
    setFilas(inicial);

    for (let i = 0; i < nombres.length; i++) {
      if (parar.current) break;

      setFilas((f) => f.map((x, j) => (j === i ? { ...x, estado: "haciendo" } : x)));

      try {
        const r = await fetch("/api/receta", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ texto: nombres[i] }),
        });
        const datos = await r.json();
        if (!r.ok) throw new Error(datos.error);

        const receta: RecetaIA = datos.receta;
        const g = await guardarReceta(receta, compartir);
        if (g?.error) throw new Error(g.error);

        setFilas((f) =>
          f.map((x, j) =>
            j === i
              ? {
                  ...x,
                  estado: "hecha",
                  detalle: `${receta.ingredientes.length} ingredientes · ${receta.pasos.length} pasos`,
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

      // Un respiro entre recetas: la API limita a dos peticiones por segundo.
      await new Promise((res) => setTimeout(res, 700));
    }

    setEnMarcha(false);
  }

  const hechas = filas.filter((f) => f.estado === "hecha").length;
  const fallos = filas.filter((f) => f.estado === "fallo").length;

  return (
    <main className="mx-auto max-w-md pb-16">
      <header className="cabecera">
        <h1 className="font-[family-name:var(--font-display)] text-[24px] font-semibold leading-none">
          Traer recetas en lote
        </h1>
        <p className="mt-1.5 text-[12.5px] opacity-80">
          Un plato por línea. La app escribe cada receta.
        </p>
      </header>

      <div className="px-5">
        {!filas.length ? (
          <>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={12}
              placeholder={"Fabada asturiana\nPisto manchego\nMarmitako\n…"}
              className="mt-6 w-full resize-none rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3.5 text-[15px] leading-relaxed"
            />

            <button
              onClick={() => setTexto(CLASICOS)}
              className="mt-2 text-[13px] text-[var(--color-pino)] underline underline-offset-4"
            >
              Rellenar con veinte clásicos españoles
            </button>

            <label className="mt-5 flex items-start gap-3 rounded-xl bg-[var(--color-pino-claro)] px-4 py-3">
              <input
                type="checkbox"
                checked={compartir}
                onChange={(e) => setCompartir(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--color-pino)]"
              />
              <span>
                <span className="block text-[13.5px] font-semibold text-[var(--color-pino)]">
                  Compartirlas con las demás casas
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--color-tenue)]">
                  Quedan visibles para cualquiera que use Mesa, con tu nombre como
                  autor. Lo puedes apagar receta por receta luego.
                </span>
              </span>
            </label>

            <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-tenue)]">
              Máximo cuarenta por tanda, y tarda unos segundos por receta. No
              cierres la pantalla mientras trabaja. Repasa después las que te
              interesen: los gramos son una estimación razonable, no una verdad
              revelada.
            </p>

            <button
              onClick={empezar}
              disabled={texto.trim().length < 3}
              className="mt-5 w-full rounded-xl bg-[var(--color-naranja)] px-4 py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              Empezar
            </button>
          </>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[13px]">
                <span className="cifra font-semibold">{hechas}</span> de{" "}
                <span className="cifra">{filas.length}</span>
                {fallos > 0 && (
                  <span className="text-[var(--color-alarma)]">
                    {" "}· {fallos} sin hacer
                  </span>
                )}
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
              {filas.map((f, i) => (
                <li
                  key={i}
                  className="tarjeta flex items-center gap-3 px-3.5 py-2.5"
                >
                  <span
                    aria-hidden
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
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
                    <span className="block truncate text-[13.5px]">{f.nombre}</span>
                    {f.detalle && (
                      <span className="block truncate text-[11px] text-[var(--color-tenue)]">
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
    </main>
  );
}
