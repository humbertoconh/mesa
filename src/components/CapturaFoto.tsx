"use client";

import { useRef, useState } from "react";
import { reducir } from "@/lib/imagen";
import type { AlimentoDesglosado } from "@/lib/tipos";

export interface Producto {
  nombre: string;
  marca: string | null;
  kcal_100: number;
  prot_100: number;
  carb_100: number;
  grasa_100: number;
}

interface Props {
  alLeerEtiqueta: (p: Producto) => void;
  alLeerPlato: (a: AlimentoDesglosado[]) => void;
  alFallar: (mensaje: string) => void;
}

export function CapturaFoto({ alLeerEtiqueta, alLeerPlato, alFallar }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function elegida(archivo: File) {
    setCargando(true);
    try {
      const { base64, tipo } = await reducir(archivo);
      setVista(`data:${tipo};base64,${base64}`);

      const r = await fetch("/api/foto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imagen: base64, tipo_medio: tipo }),
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error);

      if (datos.tipo === "etiqueta") alLeerEtiqueta(datos.alimento);
      else alLeerPlato(datos.alimentos);
    } catch (e) {
      alFallar(e instanceof Error ? e.message : "No se ha podido leer la foto.");
      setVista(null);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mt-3">
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) elegida(f);
          e.target.value = "";
        }}
      />

      {vista ? (
        <div className="overflow-hidden rounded-xl border border-[var(--color-linea)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vista} alt="" className="h-[200px] w-full object-cover" />
        </div>
      ) : (
        <button
          onClick={() => entrada.current?.click()}
          disabled={cargando}
          className="w-full rounded-xl border border-dashed border-[var(--color-linea)] px-4 py-8 text-center disabled:opacity-50"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" className="mx-auto">
            <rect x="2.5" y="6" width="19" height="14" rx="3" />
            <circle cx="12" cy="13" r="4" />
            <path d="M8.5 6l1.5-2.5h4L15.5 6" />
          </svg>
          <span className="mt-2 block text-[14px]">Hacer foto</span>
        </button>
      )}

      <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-tenue)]">
        {cargando
          ? "Leyendo la foto…"
          : "Vale tanto el plato servido como la etiqueta de información nutricional. Con la etiqueta acierta mucho más."}
      </p>
    </div>
  );
}
