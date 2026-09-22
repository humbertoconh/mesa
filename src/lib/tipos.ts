export interface Miembro {
  id: string;
  hogar_id: string;
  nombre: string;
  rol: "admin" | "miembro";
  nacimiento: string | null;
  sexo: "h" | "m" | null;
  altura_cm: number | null;
  actividad: number;
}

export interface ObjetivoFila {
  id: string;
  kcal_min: number;
  kcal_max: number;
  prot_g: number;
  carb_g: number;
  grasa_g: number;
  meta: "perder" | "mantener" | "ganar";
}

export interface Registro {
  id: string;
  fecha: string;
  momento: string;
  descripcion: string | null;
  gramos: number | null;
  kcal: number;
  prot_g: number;
  carb_g: number;
  grasa_g: number;
  origen: string;
}

/** Lo que devuelve la IA al desglosar una comida escrita. */
export interface AlimentoDesglosado {
  nombre: string;
  gramos: number;
  kcal: number;
  prot_g: number;
  carb_g: number;
  grasa_g: number;
}
