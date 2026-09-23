"use client";

import { useRef, useState } from "react";
import { cuadrada } from "@/lib/imagen";
import { subirFoto } from "@/app/recetas/actions";

interface Props {
  recetaId: string;
  foto: string | null;
  nombre: string;
}

export function FotoReceta({ recetaId, foto, nombre }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [actual, setActual] = useState(foto);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subir(archivo: File) {
    setCargando(true);
    setError(null);
    try {
      // Se recorta y se reduce aquí, en el móvil: subir 4 MB para
      // enseñar una miniatura no tiene sentido.
      const blob = await cuadrada(archivo);
      if (!blob || !blob.size) {
        throw new Error("El móvil no ha podido preparar la foto.");
      }

      const datos = new FormData();
      datos.append("foto", blob, "plato.jpg");

      const r = await subirFoto(recetaId, datos);
      if (r?.error) throw new Error(r.error);
      if (r?.url) setActual(r.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido subir.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) subir(f);
          e.target.value = "";
        }}
      />

      <button
        onClick={() => entrada.current?.click()}
        disabled={cargando}
        className="relative block w-full overflow-hidden rounded-[18px] disabled:opacity-60"
      >
        {actual ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={actual} alt={nombre} className="h-[190px] w-full object-cover" />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white">
              {cargando ? "Subiendo…" : "Cambiar foto"}
            </span>
          </>
        ) : (
          <span className="flex h-[120px] w-full flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-[var(--color-linea)] bg-[var(--color-loza)] text-[var(--color-tenue)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5">
              <rect x="2.5" y="6" width="19" height="14" rx="3" />
              <circle cx="12" cy="13" r="4" />
              <path d="M8.5 6l1.5-2.5h4L15.5 6" />
            </svg>
            <span className="text-[13px]">
              {cargando ? "Subiendo…" : "Poner una foto del plato"}
            </span>
          </span>
        )}
      </button>

      {error && (
        <p role="alert" className="mt-2 break-words text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}
    </div>
  );
}
