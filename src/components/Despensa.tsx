"use client";

import { useState, useTransition } from "react";
import { poner, quitar } from "@/app/compra/despensa/actions";
import { clave } from "@/lib/despensa";

interface Props {
  dentro: { clave: string; nombre: string }[];
  sugeridos: string[];
  deTusListas: string[];
}

export function Despensa({ dentro, sugeridos, deTusListas }: Props) {
  const [pendiente, empezar] = useTransition();
  const [texto, setTexto] = useState("");
  const puestos = new Set(dentro.map((d) => d.clave));

  function alternar(nombre: string) {
    const k = clave(nombre);
    empezar(() => {
      if (puestos.has(k)) quitar(k);
      else poner(nombre);
    });
  }

  const pastilla = (nombre: string, resaltar = false) => {
    const puesto = puestos.has(clave(nombre));
    return (
      <button
        key={nombre}
        onClick={() => alternar(nombre)}
        disabled={pendiente}
        aria-pressed={puesto}
        className="rounded-full px-3.5 py-2 text-[13px] font-medium"
        style={
          puesto
            ? { background: "var(--color-pino)", color: "#fff" }
            : resaltar
            ? { background: "var(--color-azafran-claro)", color: "#7a5410" }
            : { background: "var(--color-loza)", color: "var(--color-tinta)",
                boxShadow: "inset 0 0 0 1px var(--color-linea)" }
        }
      >
        {puesto ? "✓ " : "+ "}
        {nombre}
      </button>
    );
  };

  return (
    <div className={pendiente ? "opacity-60" : ""}>
      {deTusListas.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[13px] font-medium">De tus últimas listas</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-tenue)]">
            Lo que más te ha salido. Si ya lo tienes siempre en casa, márcalo.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {deTusListas.map((n) => pastilla(n, true))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="text-[13px] font-medium">Los de siempre</h2>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {sugeridos.map((n) => pastilla(n))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-[13px] font-medium">Añadir otro</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!texto.trim()) return;
            const n = texto;
            setTexto("");
            empezar(() => { poner(n); });
          }}
          className="mt-2 flex gap-2"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Lo que tengas siempre"
            className="flex-1 rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3.5 py-2.5 text-[14px]"
          />
          <button className="rounded-lg border border-[var(--color-pino)] px-3.5 py-2.5 text-[14px] text-[var(--color-pino)]">
            Añadir
          </button>
        </form>
      </section>

      {dentro.length > 0 && (
        <section className="mt-7">
          <h2 className="text-[13px] font-medium">
            En tu despensa ({dentro.length})
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-tenue)]">
            Esto deja de salir en la compra y pasa al final, en un apartado
            aparte, por si se acaba.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {dentro.map((d) => (
              <button
                key={d.clave}
                onClick={() => empezar(() => { quitar(d.clave); })}
                disabled={pendiente}
                className="rounded-full bg-[var(--color-pino)] px-3.5 py-2 text-[13px] font-medium text-white"
              >
                {d.nombre} ×
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
