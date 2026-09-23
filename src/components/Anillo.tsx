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
  const R = 74;
  const C = 2 * Math.PI * R;

  const proporcion = Math.min(consumidas / max, 1);
  const pasado = Math.max(0, consumidas - max);
  const marcaMin = (min / max) * C;
  const restan = Math.round(max - consumidas);

  return (
    <div className="relative mx-auto w-[200px]">
      <svg viewBox="0 0 200 200" className="w-full" role="img"
           aria-label={`${Math.round(consumidas)} de ${max} kilocalorías`}>
        <defs>
          <linearGradient id="grad-anillo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6fbf73" />
            <stop offset="100%" stopColor="#1f6a4c" />
          </linearGradient>
          <linearGradient id="grad-pasado" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f2b24f" />
            <stop offset="100%" stopColor="#f2762e" />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r={R} fill="none"
                stroke="rgba(255,255,255,0.28)" strokeWidth="16" />
        <circle
          cx="100" cy="100" r={R} fill="none"
          stroke={pasado > 0 ? "url(#grad-pasado)" : "url(#grad-anillo)"}
          strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${proporcion * C} ${C}`}
          transform="rotate(-90 100 100)"
        />
        <circle
          cx="100" cy="100" r={R} fill="none"
          stroke="#ffffff" strokeWidth="16" strokeOpacity="0.55"
          strokeDasharray={`3 ${C}`}
          strokeDashoffset={-marcaMin}
          transform="rotate(-90 100 100)"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="cifra font-[family-name:var(--font-display)] text-[40px] font-semibold leading-none">
          {Math.round(consumidas).toLocaleString("es-ES")}
        </div>
        <div className="mt-2 text-[12px] opacity-85">
          {pasado > 0
            ? `${Math.round(pasado)} por encima`
            : restan > 0
            ? `te quedan ${restan.toLocaleString("es-ES")}`
            : "justo en el rango"}
        </div>
        <div className="cifra mt-0.5 text-[11px] opacity-65">
          {min.toLocaleString("es-ES")}–{max.toLocaleString("es-ES")} kcal
        </div>
      </div>
    </div>
  );
}
