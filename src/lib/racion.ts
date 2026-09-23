import type { Momento } from "./objetivo";

/**
 * Reparto típico de las calorías del día en España. La comida pesa más
 * que la cena, al revés que en los países del norte.
 */
export const PESO_MOMENTO: Record<Momento, number> = {
  desayuno: 0.2,
  almuerzo: 0.1,
  comida: 0.35,
  merienda: 0.1,
  cena: 0.25,
};

export interface Racion {
  gramos: number;
  kcal: number;
}

/**
 * Cuánto te toca a ti de una receta pensada para varios.
 *
 * Parte de la ración normal y la ajusta a tu objetivo, pero con tope:
 * fuera del 60-150% deja de ser un plato y pasa a ser una ración
 * ridícula o una barbaridad. En ese caso es mejor cambiar de plato.
 */
export function calcularRacion(
  gramosTotales: number,
  kcalTotales: number,
  raciones: number,
  kcalObjetivoDia: number,
  momento: Momento
): Racion {
  const gramosBase = gramosTotales / raciones;
  const kcalBase = kcalTotales / raciones;
  if (kcalBase <= 0) return { gramos: Math.round(gramosBase), kcal: 0 };

  const kcalQueTocan = kcalObjetivoDia * PESO_MOMENTO[momento];
  const factor = Math.min(Math.max(kcalQueTocan / kcalBase, 0.6), 1.5);

  return {
    gramos: Math.round((gramosBase * factor) / 5) * 5,
    kcal: Math.round(kcalBase * factor),
  };
}

/** Lunes de la semana de una fecha dada, en formato AAAA-MM-DD. */
export function lunesDe(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const dia = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dia);
  return d.toISOString().slice(0, 10);
}

export function diasDeSemana(lunes: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes + "T12:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function nombreDia(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
  });
}

export const SECCIONES: Record<string, string> = {
  fruta_verdura: "Fruta y verdura",
  carniceria: "Carnicería",
  pescaderia: "Pescadería",
  lacteos: "Lácteos y huevos",
  panaderia: "Panadería",
  congelados: "Congelados",
  despensa: "Despensa",
  otros: "Otros",
};
