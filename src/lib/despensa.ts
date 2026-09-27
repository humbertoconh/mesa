/** Nombre normalizado: sin mayúsculas, sin acentos y sin espacios de sobra. */
export function clave(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Lo que hay en cualquier cocina española y no se compra cada semana.
 * Se ofrece como sugerencia; cada casa decide.
 */
export const BASICOS_SUGERIDOS = [
  "Sal", "Pimienta negra", "Aceite de oliva virgen extra", "Aceite de girasol",
  "Vinagre", "Azúcar", "Harina", "Pimentón dulce", "Pimentón picante",
  "Orégano seco", "Laurel", "Comino", "Canela", "Ajo en polvo",
  "Caldo de pollo", "Caldo de verduras", "Azafrán", "Perejil",
  "Tomillo", "Romero", "Nuez moscada", "Levadura", "Bicarbonato",
  "Maicena", "Miel", "Mostaza", "Salsa de soja", "Agua",
];
