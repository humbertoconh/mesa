interface Dia {
  fecha: string;
  kcal: number;
  min: number;
  max: number;
  apuntado: boolean;
}

/**
 * Una barra por día con la banda del objetivo dibujada detrás.
 * Los días sin apuntar salen vacíos: no son un cero, son un hueco.
 */
export function BarrasDias({ dias }: { dias: Dia[] }) {
  const alto = 150;
  const ancho = Math.max(dias.length * 22, 300);
  const tope = Math.max(...dias.map((d) => Math.max(d.kcal, d.max)), 1) * 1.1;
  const y = (v: number) => alto - (v / tope) * alto;
  const paso = ancho / dias.length;
  const grosor = Math.min(paso * 0.62, 20);

  const media =
    dias.filter((d) => d.apuntado).reduce((s, d) => s + d.min + d.max, 0) /
    (2 * Math.max(dias.filter((d) => d.apuntado).length, 1));

  return (
    <svg viewBox={`0 0 ${ancho} ${alto + 22}`} className="w-full" role="img"
         aria-label="Calorías por día frente al objetivo">
      {/* banda del objetivo, tomando la media del periodo */}
      {dias.some((d) => d.apuntado) && (
        <rect
          x="0"
          y={y(Math.max(...dias.map((d) => d.max)))}
          width={ancho}
          height={Math.abs(y(Math.min(...dias.map((d) => d.min))) - y(Math.max(...dias.map((d) => d.max))))}
          fill="var(--color-pino-claro)"
        />
      )}

      {dias.map((d, i) => {
        const x = i * paso + (paso - grosor) / 2;
        if (!d.apuntado) {
          return (
            <rect key={d.fecha} x={x} y={alto - 5} width={grosor} height={5}
                  rx="2" fill="var(--color-linea)" />
          );
        }
        const dentro = d.kcal >= d.min && d.kcal <= d.max;
        const pasado = d.kcal > d.max;
        return (
          <rect
            key={d.fecha}
            x={x}
            y={y(d.kcal)}
            width={grosor}
            height={Math.max(alto - y(d.kcal), 3)}
            rx="3"
            fill={
              dentro
                ? "var(--color-pino)"
                : pasado
                ? "var(--color-naranja)"
                : "var(--color-lima)"
            }
          />
        );
      })}

      <line x1="0" y1={alto} x2={ancho} y2={alto} stroke="var(--color-linea)" strokeWidth="1" />

      {dias.map((d, i) => {
        // Sólo las etiquetas que caben: si hay treinta días, una de cada cinco.
        const cada = dias.length > 10 ? 5 : 1;
        if (i % cada !== 0) return null;
        return (
          <text
            key={d.fecha}
            x={i * paso + paso / 2}
            y={alto + 15}
            textAnchor="middle"
            style={{ fontSize: 9, fill: "var(--color-tenue)" }}
          >
            {Number(d.fecha.slice(8, 10))}
          </text>
        );
      })}
      {media > 0 && <title>Objetivo medio del periodo: {Math.round(media)} kcal</title>}
    </svg>
  );
}
