"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { href: "/hoy", texto: "Hoy", icono: "M4 12h4l2.5-6 3 12 2.5-6h4" },
  { href: "/menu", texto: "Menú", icono: "M5 5h14M5 12h14M5 19h9" },
  { href: "/compra", texto: "Compra", icono: "M4 5h2l2.2 9.5h9.3L20 8H7M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2" },
  { href: "/progreso", texto: "Progreso", icono: "M4 18l5-5 3.5 3L20 8" },
  { href: "/casa", texto: "Casa", icono: "M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" },
];

export function Navegacion() {
  const ruta = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-[var(--color-linea)] bg-[var(--color-loza)]/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur">
      <ul className="mx-auto flex max-w-md px-1">
        {PESTANAS.map((p) => {
          const activa = ruta === p.href || ruta.startsWith(p.href + "/");
          return (
            <li key={p.href} className="flex-1">
              <Link
                href={p.href}
                aria-current={activa ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2.5"
              >
                <span
                  className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${
                    activa ? "bg-[var(--color-pino-claro)]" : ""
                  }`}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
                       stroke={activa ? "var(--color-pino)" : "var(--color-tenue)"}
                       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={p.icono} />
                  </svg>
                </span>
                <span
                  className={`text-[10.5px] ${
                    activa
                      ? "font-semibold text-[var(--color-pino)]"
                      : "text-[var(--color-tenue)]"
                  }`}
                >
                  {p.texto}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
