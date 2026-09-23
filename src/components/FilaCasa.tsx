"use client";

import { useState, useTransition } from "react";
import { borrarCasa, cambiarEstado } from "@/app/admin/actions";

export interface Casa {
  id: string;
  nombre: string;
  codigo: string;
  estado: string;
  creado_en: string;
  miembros: number;
  admin: string | null;
  recetas: number;
}

const COLORES: Record<string, string> = {
  pendiente: "bg-[var(--color-azafran-claro)] text-[#7a5410]",
  activa: "bg-[var(--color-pino-claro)] text-[var(--color-pino)]",
  bloqueada: "bg-[#fbe3e0] text-[var(--color-alarma)]",
};

export function FilaCasa({ casa }: { casa: Casa }) {
  const [pendiente, empezar] = useTransition();
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fecha = new Date(casa.creado_en).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  function lanzar(fn: () => Promise<{ error?: string } | undefined>) {
    empezar(async () => {
      const r = await fn();
      if (r?.error) setError(r.error);
    });
  }

  return (
    <article className={`tarjeta px-4 py-3.5 ${pendiente ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold">{casa.nombre}</h2>
          <p className="mt-0.5 text-[12px] text-[var(--color-tenue)]">
            {casa.admin ? `${casa.admin} · ` : ""}
            <span className="cifra">{casa.miembros}</span>{" "}
            {casa.miembros === 1 ? "persona" : "personas"} ·{" "}
            <span className="cifra">{casa.recetas}</span> recetas · {fecha}
          </p>
          <p className="cifra mt-1 text-[11px] tracking-[0.15em] text-[var(--color-tenue)]">
            {casa.codigo}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            COLORES[casa.estado] ?? ""
          }`}
        >
          {casa.estado}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}

      {borrando ? (
        <div className="mt-3">
          <p className="text-[12px] leading-relaxed text-[var(--color-alarma)]">
            Se borra la casa entera: su gente, sus recetas, su menú y su
            historial. No hay vuelta atrás.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setBorrando(false)}
              className="flex-1 rounded-lg border border-[var(--color-linea)] px-3 py-2 text-[13px]"
            >
              Dejarlo
            </button>
            <button
              onClick={() => lanzar(() => borrarCasa(casa.id))}
              className="flex-1 rounded-lg bg-[var(--color-alarma)] px-3 py-2 text-[13px] font-medium text-white"
            >
              Borrar del todo
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {casa.estado !== "activa" && (
            <button
              onClick={() => lanzar(() => cambiarEstado(casa.id, "activa"))}
              className="rounded-lg bg-[var(--color-pino)] px-3.5 py-2 text-[13px] font-medium text-white"
            >
              Aprobar
            </button>
          )}
          {casa.estado === "activa" && (
            <button
              onClick={() => lanzar(() => cambiarEstado(casa.id, "bloqueada"))}
              className="rounded-lg border border-[var(--color-linea)] px-3.5 py-2 text-[13px]"
            >
              Bloquear
            </button>
          )}
          <button
            onClick={() => setBorrando(true)}
            className="rounded-lg border border-[var(--color-linea)] px-3.5 py-2 text-[13px] text-[var(--color-alarma)]"
          >
            Borrar
          </button>
        </div>
      )}
    </article>
  );
}
