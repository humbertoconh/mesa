import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";

/**
 * Busca un producto por su código de barras.
 *
 * Primero en nuestra propia tabla, y si no está, en Open Food Facts,
 * que es una base abierta con buena cobertura de producto español.
 * Lo que venga de fuera se cachea para no volver a pedirlo.
 */
export async function POST(peticion: Request) {
  const supabase = await clienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No has entrado." }, { status: 401 });

  const { codigo } = await peticion.json();
  if (!/^\d{8,14}$/.test(String(codigo ?? ""))) {
    return NextResponse.json({ error: "Ese código no es válido." }, { status: 400 });
  }

  const { data: guardado } = await supabase
    .from("alimentos")
    .select("nombre, marca, kcal_100, prot_100, carb_100, grasa_100")
    .eq("codigo_barras", codigo)
    .maybeSingle();

  if (guardado) return NextResponse.json({ alimento: guardado });

  try {
    const r = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${codigo}.json` +
        "?fields=product_name,product_name_es,brands,nutriments",
      { headers: { "User-Agent": "Mesa - app familiar - contacto via github" } }
    );

    if (!r.ok) {
      return NextResponse.json({ error: "No he encontrado ese producto." }, { status: 404 });
    }

    const datos = await r.json();
    if (datos.status !== 1 || !datos.product) {
      return NextResponse.json(
        { error: "Ese producto no está en la base. Apúntalo escribiéndolo." },
        { status: 404 }
      );
    }

    const p = datos.product;
    const n = p.nutriments ?? {};
    const nombre = p.product_name_es || p.product_name;

    if (!nombre || n["energy-kcal_100g"] == null) {
      return NextResponse.json(
        { error: "El producto está pero sin datos nutricionales. Apúntalo a mano." },
        { status: 404 }
      );
    }

    const alimento = {
      nombre: String(nombre).slice(0, 80),
      marca: p.brands ? String(p.brands).split(",")[0].slice(0, 60) : null,
      kcal_100: Number(n["energy-kcal_100g"]) || 0,
      prot_100: Number(n.proteins_100g) || 0,
      carb_100: Number(n.carbohydrates_100g) || 0,
      grasa_100: Number(n.fat_100g) || 0,
    };

    // hogar_id null: el caché de productos envasados sirve a todo el mundo.
    await supabase
      .from("alimentos")
      .insert({ ...alimento, codigo_barras: String(codigo), fuente: "openfoodfacts" });

    return NextResponse.json({ alimento });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se ha podido consultar." }, { status: 500 });
  }
}
