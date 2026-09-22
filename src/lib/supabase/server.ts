import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function clienteServidor() {
  const galleta = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return galleta.getAll();
        },
        setAll(lista: { name: string; value: string; options: CookieOptions }[]) {
          try {
            lista.forEach(({ name, value, options }) =>
              galleta.set(name, value, options)
            );
          } catch {
            // Los Server Components no pueden escribir cookies.
            // El middleware ya refresca la sesión, así que se puede ignorar.
          }
        },
      },
    }
  );
}
