import { colorObjetivo } from "@/lib/color";

interface Props {
  consumidas: number;
  min: number;
  max: number;
}

export function Anillo({ consumidas, min, max }: Props) {
  const R = 74;
  const C = 2 * Math.PI * R;

  const proporcion = Math.min(consumidas / max, 1);
  const pasado = Math.max(0, consumidas - max);
  const marcaMin = (min / max) * C;
  const restan = Math.round(max - consumidas);

  const { claro, oscuro } = colorObjetivo(consumidas, min, max);
  const dentro = consumidas >= min && consumidas <= max;

  return (
    <div className="relative mx-auto w-[200px]">
      <svg viewBox="0 0 200 200" className="w-full" role="img"
           aria-label={`${Math.round(consumidas)} de ${max} kilocalorías`}>
        <defs>
          <linearGradient id="grad-anillo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={claro} />
            <stop offset="100%" stopColor={oscuro} />
          </linearGradient>
        </defs>

        <circle cx="100" cy="100" r={R} fill="none"
                stroke="rgba(255,255,255,0.26)" strokeWidth="16" />
        <circle
          cx="100" cy="100" r={R} fill="none"
          stroke="url(#grad-anillo)" strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${proporcion * C} ${C}`}
          transform="rotate(-90 100 100)"
        />
        {/* Marca de dónde empieza el rango bueno. */}
        <circle
          cx="100" cy="100" r={R} fill="none"
          stroke="#ffffff" strokeWidth="16" strokeOpacity="0.6"
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
            : dentro
            ? "en el rango"
            : `te quedan ${restan.toLocaleString("es-ES")}`}
        </div>
        <div className="cifra mt-0.5 text-[11px] opacity-65">
          {min.toLocaleString("es-ES")}–{max.toLocaleString("es-ES")} kcal
        </div>
      </div>
    </div>
  );
}
