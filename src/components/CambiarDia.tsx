"use client";

import { useRouter } from "next/navigation";

interface Props {
  fecha: string;
  hoy: string;
  texto: string;
}

function mover(fecha: string, dias: number) {
  const d = new Date(fecha + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Navegación por días: para apuntar lo que se olvidó ayer. */
export function CambiarDia({ fecha, hoy, texto }: Props) {
  const router = useRouter();
  const esHoy = fecha === hoy;

  const ir = (f: string) => router.push(f === hoy ? "/hoy" : `/hoy?fecha=${f}`);

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => ir(mover(fecha, -1))}
          aria-label="Día anterior"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-[16px] leading-none"
        >
          ‹
        </button>

        <div className="flex-1 text-center">
          <div className="text-[12.5px] opacity-90 first-letter:uppercase">{texto}</div>
        </div>

        <button
          onClick={() => ir(mover(fecha, 1))}
          disabled={esHoy}
          aria-label="Día siguiente"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-[16px] leading-none disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {!esHoy && (
        <button
          onClick={() => ir(hoy)}
          className="mx-auto mt-2 block rounded-full bg-white/90 px-3.5 py-1.5 text-[12px] font-semibold text-[var(--color-pino)]"
        >
          Volver a hoy
        </button>
      )}
    </div>
  );
}
