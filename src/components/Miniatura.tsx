import { inicial, manchaDe } from "@/lib/color";

interface Props {
  nombre: string;
  foto: string | null;
  tam?: number;
  radio?: number;
}

/**
 * Miniatura del plato: la foto si la hay y, si no, una mancha de color
 * con la inicial. Así ninguna lista se ve vacía ni triste.
 */
export function Miniatura({ nombre, foto, tam = 52, radio = 14 }: Props) {
  const estilo = { width: tam, height: tam, borderRadius: radio };

  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={foto}
        alt=""
        style={estilo}
        className="shrink-0 object-cover"
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{ ...estilo, ...manchaDe(nombre) } as React.CSSProperties}
      className="mancha grid shrink-0 place-items-center font-[family-name:var(--font-display)] font-semibold text-white"
    >
      <span style={{ fontSize: tam * 0.38 }}>{inicial(nombre)}</span>
    </div>
  );
}
