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
