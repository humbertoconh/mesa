"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { actualizarReceta } from "@/app/recetas/actions";
import {
  DIFICULTADES, ETIQUETAS, REGIONES, TEMPORADAS, TIPOS,
} from "@/lib/clasificacion";

interface Ing {
  id: string;
  nombre: string;
  gramos: number;
}

interface Props {
  id: string;
  nombre: string;
  raciones: number;
  minutos: number | null;
  pasos: string[];
  region: string | null;
  tipo: string | null;
  temporada: string | null;
  dificultad: string | null;
  etiquetas: string[];
  ingredientes: Ing[];
}

export function FormEditarReceta(props: Props) {
  const router = useRouter();
  const [nombre, setNombre] = useState(props.nombre);
  const [raciones, setRaciones] = useState(props.raciones);
  const [minutos, setMinutos] = useState(props.minutos ?? 0);
  const [pasos, setPasos] = useState(props.pasos);
  const [region, setRegion] = useState(props.region ?? "");
  const [tipo, setTipo] = useState(props.tipo ?? "");
  const [temporada, setTemporada] = useState(props.temporada ?? "todo el año");
  const [dificultad, setDificultad] = useState(props.dificultad ?? "");
  const [etiquetas, setEtiquetas] = useState<string[]>(props.etiquetas ?? []);
  const [ingredientes, setIngredientes] = useState(props.ingredientes);
  const [quitados, setQuitados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setCargando(true);
    setError(null);
    const r = await actualizarReceta(props.id, {
      nombre: nombre.trim() || props.nombre,
      raciones_base: raciones,
      minutos: minutos || null,
      pasos: pasos.map((p) => p.trim()).filter(Boolean),
      region: region || null,
      tipo: tipo || null,
      temporada: temporada || null,
      dificultad: dificultad || null,
      etiquetas,
      ingredientes: ingredientes.map(({ id, gramos }) => ({ id, gramos })),
      quitados,
    });
    setCargando(false);
    if (r?.error) return setError(r.error);
    router.push(`/recetas/${props.id}`);
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-10">
      <Link href={`/recetas/${props.id}`} className="text-[13px] text-[var(--color-tenue)]">
        ← Volver
      </Link>

      <h1 className="mt-3 font-[family-name:var(--font-display)] text-[24px] font-semibold leading-tight">
        Editar receta
      </h1>

      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="mt-5 w-full rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4 py-3 text-[16px] font-medium"
      />

      <div className="mt-3 flex gap-3">
        <label className="flex flex-1 items-center gap-2 text-[13px]">
          Para
          <input type="number" min={1} max={20} value={raciones}
                 onChange={(e) => setRaciones(Number(e.target.value) || 1)}
                 className="cifra w-16 rounded-lg border border-[var(--color-linea)] px-2.5 py-2 text-center" />
          personas
        </label>
        <label className="flex flex-1 items-center gap-2 text-[13px]">
          <input type="number" min={0} value={minutos}
                 onChange={(e) => setMinutos(Number(e.target.value) || 0)}
                 className="cifra w-16 rounded-lg border border-[var(--color-linea)] px-2.5 py-2 text-center" />
          minutos
        </label>
      </div>

      <h2 className="mt-6 text-[13px] font-medium">Clasificación</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-tenue)]">
        Sirve para buscar después. No hace falta rellenarlo todo.
      </p>

      <div className="mt-3 flex flex-col gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-[var(--color-tenue)]">De dónde es</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3 py-2.5 text-[14px]"
          >
            <option value="">Sin especificar</option>
            {REGIONES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-[var(--color-tenue)]">Qué es</span>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3 py-2.5 text-[14px]"
            >
              <option value="">Sin especificar</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-[var(--color-tenue)]">Cuándo apetece</span>
            <select
              value={temporada}
              onChange={(e) => setTemporada(e.target.value)}
              className="rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3 py-2.5 text-[14px]"
            >
              {TEMPORADAS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-[var(--color-tenue)]">Cuánta mano pide</span>
          <select
            value={dificultad}
            onChange={(e) => setDificultad(e.target.value)}
            className="rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3 py-2.5 text-[14px]"
          >
            <option value="">Sin especificar</option>
            {DIFICULTADES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>

      <h2 className="mt-6 text-[13px] font-medium">Etiquetas</h2>
      <p className="mt-1 text-[12px] text-[var(--color-tenue)]">
        Toca para poner o quitar. {etiquetas.length} puestas.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {ETIQUETAS.map((e) => {
          const puesta = etiquetas.includes(e);
          return (
            <button
              key={e}
              onClick={() =>
                setEtiquetas(
                  puesta ? etiquetas.filter((x) => x !== e) : [...etiquetas, e]
                )
              }
              aria-pressed={puesta}
              className="rounded-full px-3 py-1.5 text-[12px] font-medium"
              style={
                puesta
                  ? { background: "var(--color-azafran)", color: "#fff" }
                  : { background: "var(--color-azafran-claro)", color: "#7a5410" }
              }
            >
              {e}
            </button>
          );
        })}
      </div>

      <h2 className="mt-6 text-[13px] font-medium">Ingredientes</h2>
      <ul className="mt-2 divide-y divide-[var(--color-linea)] rounded-xl border border-[var(--color-linea)] bg-[var(--color-loza)] px-4">
        {ingredientes.map((ing, i) => (
          <li key={ing.id} className="flex items-center gap-3 py-2.5">
            <span className="flex-1 text-[14px]">{ing.nombre}</span>
            <input
              type="number"
              value={ing.gramos}
              onChange={(e) => {
                const copia = [...ingredientes];
                copia[i] = { ...ing, gramos: Number(e.target.value) || 0 };
                setIngredientes(copia);
              }}
              className="cifra w-20 rounded-lg border border-[var(--color-linea)] px-2 py-1.5 text-right text-[13px]"
            />
            <span className="text-[12px] text-[var(--color-tenue)]">g</span>
            <button
              onClick={() => {
                setQuitados([...quitados, ing.id]);
                setIngredientes(ingredientes.filter((_, j) => j !== i));
              }}
              aria-label={`Quitar ${ing.nombre}`}
              className="text-[18px] leading-none text-[var(--color-tenue)]"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-tenue)]">
        Para meter un ingrediente nuevo hace falta su valor nutricional, así que
        eso va por la pantalla de crear receta. Aquí puedes corregir cantidades y
        quitar lo que sobre.
      </p>

      <h2 className="mt-6 text-[13px] font-medium">Pasos</h2>
      <div className="mt-2 flex flex-col gap-2">
        {pasos.map((paso, i) => (
          <div key={i} className="flex gap-2">
            <span className="cifra pt-3 text-[12px] text-[var(--color-tenue)]">{i + 1}</span>
            <textarea
              value={paso}
              rows={2}
              onChange={(e) => {
                const copia = [...pasos];
                copia[i] = e.target.value;
                setPasos(copia);
              }}
              className="flex-1 resize-none rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3 py-2 text-[13px] leading-relaxed"
            />
            <button
              onClick={() => setPasos(pasos.filter((_, j) => j !== i))}
              aria-label={`Quitar paso ${i + 1}`}
              className="text-[18px] leading-none text-[var(--color-tenue)]"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => setPasos([...pasos, ""])}
          className="rounded-lg border border-dashed border-[var(--color-linea)] px-3 py-2.5 text-[13px] text-[var(--color-tenue)]"
        >
          + Añadir paso
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <Link
          href={`/recetas/${props.id}`}
          className="rounded-xl border border-[var(--color-linea)] px-4 py-3 text-[14px]"
        >
          Cancelar
        </Link>
        <button
          onClick={guardar}
          disabled={cargando}
          className="flex-1 rounded-xl bg-[var(--color-pino)] px-4 py-3 text-[15px] font-medium text-white disabled:opacity-50"
        >
          {cargando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </main>
  );
}
