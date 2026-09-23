import { banda } from "@/lib/clasificacion";

export interface Filtrable {
  tipo: string | null;
  region: string | null;
  etiquetas: string[] | null;
  raciones_base: number;
  receta_ingredientes: { gramos: number; alimentos: { kcal_100: number } | null }[];
}

export interface Filtros {
  tipo?: string;
  region?: string;
  etiqueta?: string;
  banda?: string;
  q?: string;
}

export function kcalRacion(r: Filtrable): number {
  const total = r.receta_ingredientes.reduce(
    (s, i) => s + (Number(i.gramos) * Number(i.alimentos?.kcal_100 ?? 0)) / 100,
    0
  );
  return Math.round(total / (r.raciones_base || 1));
}

/**
 * Los filtros se aplican aquí y no en la consulta porque la banda de
 * calorías se calcula de los ingredientes: no existe como columna.
 */
export function aplicar<T extends Filtrable & { nombre: string }>(
  lista: T[],
  f: Filtros
): T[] {
  return lista.filter((r) => {
    if (f.tipo && r.tipo !== f.tipo) return false;
    if (f.region && r.region !== f.region) return false;
    if (f.etiqueta && !(r.etiquetas ?? []).includes(f.etiqueta)) return false;
    if (f.banda && banda(kcalRacion(r)) !== f.banda) return false;
    if (f.q && !r.nombre.toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  });
}
