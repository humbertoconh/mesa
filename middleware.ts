import { type NextRequest } from "next/server";
import { refrescarSesion } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await refrescarSesion(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
