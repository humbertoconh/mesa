/**
 * Color estable a partir de un texto. Sirve para que cada receta sin
 * foto tenga su propia mancha de color, siempre la misma.
 */
const PAREJAS: [string, string][] = [
  ["#f7a96b", "#ef6f3c"],
  ["#8fd0a0", "#2f8d5f"],
  ["#8dc5e0", "#2f7fa8"],
  ["#f4cf72", "#e09b12"],
  ["#e59db4", "#c4456a"],
  ["#b7c98a", "#7a9a3c"],
  ["#c8b2e0", "#8a5fbf"],
  ["#f2a9a0", "#d1584a"],
];

export function manchaDe(texto: string): { "--m1": string; "--m2": string } {
  let n = 0;
  for (let i = 0; i < texto.length; i++) n = (n * 31 + texto.charCodeAt(i)) >>> 0;
  const [a, b] = PAREJAS[n % PAREJAS.length];
  return { "--m1": a, "--m2": b };
}

/** Inicial del plato, para poner encima de la mancha. */
export function inicial(texto: string): string {
  return texto.trim().charAt(0).toUpperCase() || "?";
}

/**
 * Color del anillo según lo cerca que estés del objetivo.
 *
 * Rojo cuando vas muy corto, verde al entrar en el rango bueno, y de
 * vuelta al rojo si te pasas. En tonos pastel, que esto no es una
 * alarma de incendios.
 */
export function colorObjetivo(consumidas: number, min: number, max: number) {
  let t: number; // 0 = lejos, 1 = en el sitio

  if (consumidas <= min) {
    t = min > 0 ? Math.min(consumidas / min, 1) : 1;
  } else if (consumidas <= max) {
    t = 1;
  } else {
    // Un 30% por encima ya es rojo del todo.
    const exceso = (consumidas - max) / max;
    t = Math.max(0, 1 - exceso / 0.3);
  }

  // Suavizamos el arranque: los primeros bocados del día no tienen por
  // qué pintarse de rojo intenso.
  const suave = Math.pow(t, 0.75);
  const tono = 6 + suave * 134; // 6 = rojo, 140 = verde

  return {
    claro: `hsl(${tono} 65% 72%)`,
    oscuro: `hsl(${tono} 52% 52%)`,
  };
}
