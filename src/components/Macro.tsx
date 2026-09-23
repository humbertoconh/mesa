interface Props {
  nombre: string;
  actual: number;
  objetivo: number;
  color: string;
  fondo: string;
}

export function Macro({ nombre, actual, objetivo, color, fondo }: Props) {
  const pct = objetivo > 0 ? Math.min((actual / objetivo) * 100, 100) : 0;

  return (
    <div className="tarjeta flex-1 px-3 py-3">
      <div className="text-[11px] font-medium" style={{ color }}>
        {nombre}
      </div>
      <div className="cifra mt-1 text-[17px] font-semibold leading-none">
        {Math.round(actual)}
        <span className="text-[11px] font-normal text-[var(--color-tenue)]">
          {" "}/ {objetivo} g
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full"
        style={{ background: fondo }}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
