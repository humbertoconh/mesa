"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ponerPlato, quitarPlato } from "@/app/menu/actions";
import { Miniatura } from "@/components/Miniatura";

interface Props {
  fecha: string;
  momento: string;
  recetas: { id: string; nombre: string }[];
  puesto: {
    id: string;
    nombre: string;
    foto: string | null;
    racion: { gramos: number; kcal: number } | null;
  } | null;
}

export function SelectorPlato({ fecha, momento, recetas, puesto }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, empezar] = useTransition();

  if (puesto && !abierto) {
    return (
      <div className={`flex items-center gap-2 ${pendiente ? "opacity-40" : ""}`}>
        <Miniatura nombre={puesto.nombre} foto={puesto.foto} tam={38} radio={11} />
        <Link href={`/recetas/${puesto.id}`} className="flex-1 text-[14px]">
          {puesto.nombre}
          {puesto.racion && (
            <span className="mt-0.5 block text-[11px] text-[var(--color-tenue)]">
              tu ración:{" "}
              <span className="cifra">
                {puesto.racion.gramos} g · {puesto.racion.kcal} kcal
              </span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Cambiar plato"
          className="shrink-0 px-1 text-[13px] text-[var(--color-tenue)]"
        >
          cambiar
        </button>
        <button
          onClick={() => empezar(() => { quitarPlato(fecha, momento); })}
          aria-label="Quitar plato"
          className="shrink-0 px-1 text-[17px] leading-none text-[var(--color-tenue)]"
        >
          ×
        </button>
      </div>
    );
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full text-left text-[13px] text-[var(--color-tenue)]"
      >
        + Poner plato
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        autoFocus
        defaultValue=""
        disabled={pendiente}
        onChange={(e) => {
          const id = e.target.value;
          if (!id) return;
          empezar(() => {
            ponerPlato(fecha, momento, id).then(() => setAbierto(false));
          });
        }}
        className="flex-1 rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-2.5 py-2 text-[13px]"
      >
        <option value="">Elige un plato…</option>
        {recetas.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nombre}
          </option>
        ))}
      </select>
      <button
        onClick={() => setAbierto(false)}
        className="shrink-0 px-1 text-[17px] leading-none text-[var(--color-tenue)]"
      >
        ×
      </button>
    </div>
  );
}
