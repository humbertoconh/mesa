/**
 * Cálculo del objetivo diario.
 *
 * Mifflin-St Jeor para el metabolismo basal, por factor de actividad,
 * y luego el ajuste según la meta. Es la fórmula que usan casi todas
 * las apps del sector y la que mejor se comporta en población normal.
 */

export type Sexo = "h" | "m";
export type Meta = "perder" | "mantener" | "ganar";

export interface DatosPersona {
  kg: number;
  altura_cm: number;
  edad: number;
  sexo: Sexo;
  actividad: number; // 1.2 sedentario · 1.4 ligero · 1.6 activo · 1.8 muy activo
  meta: Meta;
}

export interface Objetivo {
  kcal_min: number;
  kcal_max: number;
  prot_g: number;
  carb_g: number;
  grasa_g: number;
}

function metabolismoBasal({ kg, altura_cm, edad, sexo }: DatosPersona): number {
  const base = 10 * kg + 6.25 * altura_cm - 5 * edad;
  return sexo === "h" ? base + 5 : base - 161;
}

export function calcularObjetivo(datos: DatosPersona): Objetivo {
  const gasto = metabolismoBasal(datos) * datos.actividad;

  const factor = { perder: 0.85, mantener: 1, ganar: 1.1 }[datos.meta];
  const centro = gasto * factor;

  // Proteína por kilo de peso. Al perder se sube para no dejarse músculo.
  const prot_g = Math.round(datos.kg * (datos.meta === "perder" ? 2.0 : 1.8));

  // La grasa no baja del 25% de las calorías: por debajo se resiente
  // el descanso y las hormonas.
  const grasa_g = Math.round((centro * 0.25) / 9);

  const restan = centro - prot_g * 4 - grasa_g * 9;
  const carb_g = Math.max(0, Math.round(restan / 4));

  // Un rango, no una cifra exacta. Cumplir 2.134 kcal clavadas no lo
  // hace nadie, y fallar por 30 kcal desmotiva sin motivo.
  return {
    kcal_min: Math.round((centro - 100) / 10) * 10,
    kcal_max: Math.round((centro + 100) / 10) * 10,
    prot_g,
    carb_g,
    grasa_g,
  };
}

export function edadDesde(nacimiento: string): number {
  const n = new Date(nacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) edad--;
  return edad;
}

export const MOMENTOS = ["desayuno", "almuerzo", "comida", "merienda", "cena"] as const;
export type Momento = (typeof MOMENTOS)[number];

export function momentoSugerido(hora = new Date().getHours()): Momento {
  if (hora < 11) return "desayuno";
  if (hora < 13) return "almuerzo";
  if (hora < 16) return "comida";
  if (hora < 19) return "merienda";
  return "cena";
}

export function hoyISO(): string {
  // Fecha local, no UTC: si no, a partir de las 2 de la mañana en
  // España la cena se te va al día siguiente.
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
