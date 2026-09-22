"use client";

import { useState } from "react";
import { MOMENTOS, momentoSugerido } from "@/lib/objetivo";
import { guardarComida } from "@/app/hoy/actions";
import type { AlimentoDesglosado } from "@/lib/tipos";

export function AnadirComida() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [momento, setMomento] = useState<string>(momentoSugerido());
  const [lista, setLista] = useState<AlimentoDesglosado[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function desglosar() {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/desglosar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error);
      if (!datos.alimentos?.length) throw new Error("No he encontrado comida ahí.");
      setLista(datos.alimentos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado.");
    } finally {
      setCargando(false);
    }
  }

  async function guardar() {
    if (!lista) return;
    setCargando(true);
    const r = await guardarComida(momento, texto, lista);
    setCargando(false);
    if (r?.error) return setError(r.error);
    cerrar();
  }

  function cerrar() {
    setAbierto(false);
    setTexto("");
    setLista(null);
    setError(null);
  }

  const total = lista?.reduce((s, a) => s + a.kcal, 0) ?? 0;

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full rounded-xl border border-dashed border-[var(--color-linea)] px-4 py-4 text-[14px] text-[var(--color-tenue)]"
      >
        Apuntar una comida
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-pino)] bg-[var(--color-loza)] p-4">
      <div className="flex flex-wrap gap-1.5">
        {MOMENTOS.map((m) => (
          <button
            key={m}
            onClick={() => setMomento(m)}
            className={`rounded-full px-3 py-1.5 text-[12px] capitalize ${
              momento === m
                ? "bg-[var(--color-pino)] text-white"
                : "bg-[var(--color-pino-claro)] text-[var(--color-pino)]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {!lista ? (
        <>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            autoFocus
            placeholder="dos huevos fritos, pan con tomate y un café con leche"
            className="mt-3 w-full resize-none rounded-lg border border-[var(--color-linea)] px-3.5 py-3 text-[15px] leading-relaxed"
          />
          <p className="mt-1.5 text-[12px] text-[var(--color-tenue)]">
            Escríbelo como se lo contarías a alguien. Ya se encarga la app de las cifras.
          </p>
        </>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--color-linea)]">
          {lista.map((a, i) => (
            <li key={i} className="flex items-baseline justify-between gap-3 py-2.5">
              <div>
                <div className="text-[14px]">{a.nombre}</div>
                <div className="cifra text-[12px] text-[var(--color-tenue)]">
                  {a.gramos} g · P {Math.round(a.prot_g)} · H {Math.round(a.carb_g)} · G{" "}
                  {Math.round(a.grasa_g)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="cifra text-[13px]">{Math.round(a.kcal)}</span>
                <button
                  onClick={() => setLista(lista.filter((_, j) => j !== i))}
                  aria-label={`Quitar ${a.nombre}`}
                  className="text-[18px] leading-none text-[var(--color-tenue)]"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
          <li className="flex justify-between pt-2.5 text-[14px] font-medium">
            <span>Total</span>
            <span className="cifra">{Math.round(total)} kcal</span>
          </li>
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={cerrar}
          className="rounded-lg border border-[var(--color-linea)] px-4 py-2.5 text-[14px]"
        >
          Cancelar
        </button>
        <button
          onClick={lista ? guardar : desglosar}
          disabled={cargando || (!lista && texto.trim().length < 3)}
          className="flex-1 rounded-lg bg-[var(--color-pino)] px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
        >
          {cargando ? "Un momento…" : lista ? "Guardar" : "Desglosar"}
        </button>
      </div>
    </div>
  );
}
