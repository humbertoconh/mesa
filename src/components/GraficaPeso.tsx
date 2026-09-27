import { tendencia } from "@/lib/gasto";

interface Punto {
  fecha: string;
  kg: number;
}

/**
 * Gráfica sencilla en SVG. Sin librerías: para ocho puntos y una línea
 * no merece la pena meter 200 kB de dependencia.
 */
export function GraficaPeso({ puntos }: { puntos: Punto[] }) {
  if (puntos.length < 2) {
    return (
      <p className="py-6 text-center text-[13px] text-[var(--color-tenue)]">
        Con dos pesadas ya te dibujo la línea.
      </p>
    );
  }

  const W = 320;
  const H = 130;
  const M = 14;

  const kgs = puntos.map((p) => p.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  // Si apenas ha variado, un margen fijo evita una línea en zigzag falso.
  const rango = Math.max(max - min, 2);
  const base = (min + max) / 2 - rango / 2;

  const x = (i: number) => M + (i / (puntos.length - 1)) * (W - M * 2);
  const y = (kg: number) => H - M - ((kg - base) / rango) * (H - M * 2);

  const linea = puntos.map((p, i) => `${x(i)},${y(p.kg)}`).join(" ");
  // La tendencia es lo que de verdad dice algo: el peso diario es agua y sal.
  const suave = tendencia(puntos);
  const lineaSuave = suave.map((p, i) => `${x(i)},${y(p.kg)}`).join(" ");
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  const dif = ultimo.kg - primero.kg;

  const fmt = (f: string) =>
    new Date(f).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
           aria-label={`Peso: de ${primero.kg} a ${ultimo.kg} kilos`}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={M} x2={W - M} y1={M + f * (H - M * 2)} y2={M + f * (H - M * 2)}
                stroke="var(--color-pino-claro)" strokeWidth="1" />
        ))}
        <polyline points={linea} fill="none" stroke="var(--color-linea)"
                  strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={lineaSuave} fill="none" stroke="var(--color-pino)"
                  strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {puntos.map((p, i) => (
          <circle key={p.fecha} cx={x(i)} cy={y(p.kg)} r={i === puntos.length - 1 ? 3.5 : 2}
                  fill="var(--color-linea)" />
        ))}
        <circle cx={x(suave.length - 1)} cy={y(suave[suave.length - 1].kg)} r="4.5"
                fill="var(--color-pino)" />
      </svg>

      <div className="mt-1 flex justify-between text-[11px] text-[var(--color-tenue)]">
        <span>{fmt(primero.fecha)}</span>
        <span className="cifra">
          {dif === 0
            ? "igual que al empezar"
            : `${dif > 0 ? "+" : ""}${dif.toFixed(1)} kg`}
        </span>
        <span>{fmt(ultimo.fecha)}</span>
      </div>
    </div>
  );
}
