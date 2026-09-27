/**
 * Gasto energético real, deducido en vez de calculado.
 *
 * La fórmula de Mifflin es una media de población: acierta de largo pero
 * falla en cada persona concreta. Si sabemos lo que has comido y cómo ha
 * cambiado tu peso, el gasto sale por diferencia y no hay que creerse
 * ninguna fórmula.
 */

/** Kilocalorías que representa un kilo de peso corporal ganado o perdido. */
const KCAL_POR_KILO = 7700;

export interface Pesada {
  fecha: string;
  kg: number;
}

/**
 * Media móvil del peso. El peso diario es ruido: agua, sal y lo de ayer.
 * Lo que dice algo es la tendencia.
 */
export function tendencia(pesos: Pesada[], ventana = 7): Pesada[] {
  const orden = [...pesos].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return orden.map((p, i) => {
    const desde = Math.max(0, i - ventana + 1);
    const trozo = orden.slice(desde, i + 1);
    const media = trozo.reduce((s, x) => s + Number(x.kg), 0) / trozo.length;
    return { fecha: p.fecha, kg: Math.round(media * 100) / 100 };
  });
}

export interface Medicion {
  gasto: number;
  dias: number;
  diasApuntados: number;
  cambioKg: number;
  kcalMedia: number;
}

/**
 * Deduce el gasto diario.
 *
 * gasto = lo que comes de media − lo que has ganado o perdido en energía
 *
 * Devuelve null si no hay datos para fiarse: hacen falta al menos diez
 * días con comida apuntada y dos semanas entre la primera y la última
 * pesada. Con menos, el ruido se come la señal.
 */
export function gastoReal(
  kcalPorDia: Map<string, number>,
  pesos: Pesada[]
): Medicion | null {
  const suave = tendencia(pesos);
  if (suave.length < 2) return null;

  const ini = suave[0];
  const fin = suave[suave.length - 1];

  const dias =
    (new Date(fin.fecha + "T12:00:00").getTime() -
      new Date(ini.fecha + "T12:00:00").getTime()) /
    86400000;
  if (dias < 14) return null;

  // Sólo cuentan los días con comida apuntada dentro del periodo.
  const dentro = [...kcalPorDia.entries()].filter(
    ([f]) => f >= ini.fecha && f <= fin.fecha
  );
  if (dentro.length < 10) return null;

  const kcalMedia = dentro.reduce((s, [, k]) => s + k, 0) / dentro.length;
  const cambioKg = fin.kg - ini.kg;

  // Si bajas de peso, gastas más de lo que comes. De ahí el menos.
  const gasto = kcalMedia - (cambioKg * KCAL_POR_KILO) / dias;

  // Un resultado disparatado significa que faltan días por apuntar.
  if (gasto < 1000 || gasto > 6000) return null;

  return {
    gasto: Math.round(gasto),
    dias: Math.round(dias),
    diasApuntados: dentro.length,
    cambioKg: Math.round(cambioKg * 100) / 100,
    kcalMedia: Math.round(kcalMedia),
  };
}
