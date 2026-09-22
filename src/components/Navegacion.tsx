"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { href: "/hoy", texto: "Hoy" },
  { href: "/progreso", texto: "Progreso" },
  { href: "/casa", texto: "Casa" },
];

export function Navegacion() {
  const ruta = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-[var(--color-linea)] bg-[var(--color-loza)] pb-[env(safe-area-inset-bottom,0px)]">
      <ul className="mx-auto flex max-w-md">
        {PESTANAS.map((p) => {
          const activa = ruta === p.href;
          return (
            <li key={p.href} className="flex-1">
              <Link
                href={p.href}
                aria-current={activa ? "page" : undefined}
                className={`block py-3.5 text-center text-[13px] ${
                  activa
                    ? "font-medium text-[var(--color-pino)]"
                    : "text-[var(--color-tenue)]"
                }`}
              >
                {p.texto}
                <span
                  className={`mx-auto mt-1.5 block h-[2px] w-6 rounded-full ${
                    activa ? "bg-[var(--color-pino)]" : "bg-transparent"
                  }`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
