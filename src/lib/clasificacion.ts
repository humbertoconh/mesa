/**
 * Vocabulario cerrado de clasificación.
 *
 * Cerrado a propósito: si se deja libre acabas con «rapidito», «rápido»
 * y «exprés» como tres cosas distintas y el filtro deja de servir.
 */

export const REGIONES = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias", "Cantabria",
  "Castilla-La Mancha", "Castilla y León", "Cataluña", "Comunitat Valenciana",
  "Extremadura", "Galicia", "La Rioja", "Madrid", "Murcia", "Navarra",
  "País Vasco", "De toda España", "De fuera",
] as const;

export const TIPOS = [
  "desayuno", "almuerzo", "entrante", "primero", "segundo",
  "plato único", "guarnición", "merienda", "postre", "para picar",
] as const;

export const TEMPORADAS = ["todo el año", "verano", "invierno", "entretiempo"] as const;

export const DIFICULTADES = ["fácil", "media", "elaborada"] as const;

/** Etiquetas de varios valores: técnica, ingrediente principal y dieta. */
export const ETIQUETAS = [
  // ingrediente
  "carne", "pescado", "marisco", "legumbre", "arroz", "pasta",
  "verdura", "huevo", "patata", "setas",
  // forma
  "guiso", "horno", "plancha", "fritura", "sopa", "ensalada", "crudo",
  "airfryer",
  // práctica
  "rápido", "olla exprés", "se congela bien", "mejor de un día para otro",
  "de aprovechamiento", "barato",
  // dieta
  "vegetariano", "vegano", "sin gluten", "sin lactosa", "picante",
  "gusta a los niños", "alta cocina",
] as const;

export type Etiqueta = (typeof ETIQUETAS)[number];

/** Cuánto llena el plato. Se calcula, no se guarda: si no, se queda viejo. */
export function banda(kcalRacion: number): "ligero" | "medio" | "contundente" {
  if (kcalRacion < 400) return "ligero";
  if (kcalRacion <= 700) return "medio";
  return "contundente";
}

export const BANDAS = {
  ligero: { texto: "Ligero", detalle: "menos de 400 kcal" },
  medio: { texto: "Medio", detalle: "400 a 700 kcal" },
  contundente: { texto: "Contundente", detalle: "más de 700 kcal" },
} as const;
