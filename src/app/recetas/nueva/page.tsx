"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import { guardarReceta, subirFoto, type RecetaIA } from "../actions";
import { SECCIONES } from "@/lib/racion";
import { cuadrada } from "@/lib/imagen";
import { Clasificacion, type ValorClasificacion } from "@/components/Clasificacion";

export default function NuevaReceta() {
  const router = useRouter();
  const entradaFoto = useRef<HTMLInputElement>(null);

  const [texto, setTexto] = useState("");
  const [receta, setReceta] = useState<RecetaIA | null>(null);
  const [clasif, setClasif] = useState<ValorClasificacion>({
    region: "", tipo: "", temporada: "todo el año", dificultad: "", etiquetas: [],
  });
  const [foto, setFoto] = useState<{ blob: Blob; vista: string } | null>(null);
  const [compartir, setCompartir] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [paso, setPaso] = useState<string | null>(null);
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

      const rec: RecetaIA = datos.receta;
      setReceta(rec);
      setClasif({
        region: rec.region ?? "",
        tipo: rec.tipo ?? "",
        temporada: rec.temporada ?? "todo el año",
        dificultad: rec.dificultad ?? "",
        etiquetas: rec.etiquetas ?? [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado.");
    } finally {
      setCargando(false);
    }
  }

  async function elegirFoto(archivo: File) {
    try {
      const blob = await cuadrada(archivo);
      setFoto({ blob, vista: URL.createObjectURL(blob) });
    } catch {
      setError("El móvil no ha podido preparar la foto.");
    }
  }

  async function guardar() {
    if (!receta) return;
    setCargando(true);
    setError(null);

    try {
      setPaso("Guardando la receta…");
      const g = await guardarReceta(
        {
          ...receta,
          region: clasif.region || null,
          tipo: clasif.tipo || null,
          temporada: clasif.temporada || null,
          dificultad: clasif.dificultad || null,
          etiquetas: clasif.etiquetas,
        },
        compartir
      );
      if (g?.error || !g?.id) throw new Error(g?.error ?? "No se ha podido guardar.");

      if (foto) {
        setPaso("Subiendo la foto…");
        const datos = new FormData();
        datos.append("foto", foto.blob, "plato.jpg");
        const f = await subirFoto(g.id, datos);
        // Si la foto falla, la receta ya está guardada: no la perdemos
        // por eso. Se avisa y se entra igual, que la foto se puede
        // poner luego desde la ficha.
        if (f?.error) console.error("Foto:", f.error);
      }

      router.push(`/recetas/${g.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado.");
      setCargando(false);
      setPaso(null);
    }
  }

  const kcalTotal =
    receta?.ingredientes.reduce((s, i) => s + (i.gramos * i.kcal_100) / 100, 0) ?? 0;

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
          {/* Foto */}
          <input
            ref={entradaFoto}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) elegirFoto(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => entradaFoto.current?.click()}
            className="relative mt-4 block w-full overflow-hidden rounded-[18px]"
          >
            {foto ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.vista} alt="" className="h-[170px] w-full object-cover" />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white">
                  Cambiar
                </span>
              </>
            ) : (
              <span className="flex h-[96px] w-full flex-col items-center justify-center gap-1.5 rounded-[18px] border border-dashed border-[var(--color-linea)] bg-[var(--color-loza)] text-[var(--color-tenue)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.5">
                  <rect x="2.5" y="6" width="19" height="14" rx="3" />
                  <circle cx="12" cy="13" r="4" />
                  <path d="M8.5 6l1.5-2.5h4L15.5 6" />
                </svg>
                <span className="text-[13px]">Foto del plato (opcional)</span>
              </span>
            )}
          </button>

          <input
            value={receta.nombre}
            onChange={(e) => setReceta({ ...receta, nombre: e.target.value })}
            className="mt-3 w-full rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3 text-[16px] font-medium"
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
          <ul className="tarjeta mt-2 divide-y divide-[var(--color-linea)] px-4">
            {receta.ingredientes.map((ing, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px]">{ing.nombre}</div>
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
            Corrige los gramos si no cuadran: es lo que saldrá en la lista de la
            compra.
          </p>

          <h2 className="mt-6 text-[13px] font-medium">Clasificación</h2>
          <p className="mt-1 text-[12px] text-[var(--color-tenue)]">
            Repasa lo que ha puesto. Con esto buscarás después.
          </p>
          <Clasificacion valor={clasif} alCambiar={setClasif} />

          {receta.pasos.length > 0 && (
            <>
              <h2 className="mt-6 text-[13px] font-medium">Pasos</h2>
              <ol className="mt-2 flex flex-col gap-2">
                {receta.pasos.map((p, i) => (
                  <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                    <span className="cifra shrink-0 text-[var(--color-tenue)]">{i + 1}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          <label className="mt-6 flex items-start gap-3 rounded-xl bg-[var(--color-pino-claro)] px-4 py-3">
            <input
              type="checkbox"
              checked={compartir}
              onChange={(e) => setCompartir(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-pino)]"
            />
            <span>
              <span className="block text-[13.5px] font-semibold text-[var(--color-pino)]">
                Compartirla con las demás casas
              </span>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--color-tenue)]">
                La podrán ver y copiar, con tu nombre como autor.
              </span>
            </span>
          </label>

          {error && (
            <p role="alert" className="mt-4 text-[13px] text-[var(--color-alarma)]">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setReceta(null)}
              disabled={cargando}
              className="rounded-xl border border-[var(--color-linea)] px-4 py-3 text-[14px]"
            >
              Volver
            </button>
            <button
              onClick={guardar}
              disabled={cargando}
              className="flex-1 rounded-xl bg-[var(--color-pino)] px-4 py-3 text-[15px] font-medium text-white disabled:opacity-50"
            >
              {cargando ? (paso ?? "Guardando…") : "Guardar receta"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
