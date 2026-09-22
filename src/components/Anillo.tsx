interface Props {
  consumidas: number;
  min: number;
  max: number;
}

/**
 * Anillo del día. La marca fina señala dónde empieza el rango bueno,
 * porque el objetivo es caer dentro, no clavar una cifra.
 */
export function Anillo({ consumidas, min, max }: Props) {
  const R = 68;
  const C = 2 * Math.PI * R;

  const proporcion = Math.min(consumidas / max, 1);
  const pasado = Math.max(0, consumidas - max);
  const marcaMin = (min / max) * C;

  const restan = Math.round(max - consumidas);
  const color = pasado > 0 ? "var(--color-ambar)" : "var(--color-pino)";

  return (
    <div className="relative mx-auto w-[184px]">
      <svg viewBox="0 0 184 184" className="w-full" role="img"
           aria-label={`${Math.round(consumidas)} de ${max} kilocalorías`}>
        <circle cx="92" cy="92" r={R} fill="none"
                stroke="var(--color-pino-claro)" strokeWidth="14" />
        <circle
          cx="92" cy="92" r={R} fill="none"
          stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${proporcion * C} ${C}`}
          transform="rotate(-90 92 92)"
        />
        <circle
          cx="92" cy="92" r={R} fill="none"
          stroke="var(--color-tinta)" strokeWidth="14" strokeOpacity="0.28"
          strokeDasharray={`2 ${C}`}
          strokeDashoffset={-marcaMin}
          transform="rotate(-90 92 92)"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="cifra font-[family-name:var(--font-display)] text-[34px] font-semibold leading-none">
          {Math.round(consumidas).toLocaleString("es-ES")}
        </div>
        <div className="mt-1.5 text-[12px] text-[var(--color-tenue)]">
          {pasado > 0
            ? `${Math.round(pasado)} por encima`
            : restan > 0
            ? `te quedan ${restan.toLocaleString("es-ES")}`
            : "justo en el rango"}
        </div>
        <div className="mt-0.5 cifra text-[11px] text-[var(--color-tenue)]">
          {min.toLocaleString("es-ES")}–{max.toLocaleString("es-ES")} kcal
        </div>
      </div>
    </div>
  );
}
