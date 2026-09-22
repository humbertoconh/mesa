interface Props {
  nombre: string;
  actual: number;
  objetivo: number;
  color: string;
}

export function Macro({ nombre, actual, objetivo, color }: Props) {
  const pct = objetivo > 0 ? Math.min((actual / objetivo) * 100, 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px]">{nombre}</span>
        <span className="cifra text-[12px] text-[var(--color-tenue)]">
          {Math.round(actual)} / {objetivo} g
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-pino-claro)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
