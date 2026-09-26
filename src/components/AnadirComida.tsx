"use client";

import { useCallback, useState } from "react";
import { MOMENTOS, momentoSugerido } from "@/lib/objetivo";
import { guardarComida } from "@/app/hoy/actions";
import { Escaner } from "@/components/Escaner";
import { CapturaFoto, type Producto } from "@/components/CapturaFoto";
import type { AlimentoDesglosado } from "@/lib/tipos";

type Modo = "cerrado" | "elegir" | "texto" | "escaner" | "foto" | "producto";

export function AnadirComida({ fecha }: { fecha: string }) {
  const [modo, setModo] = useState<Modo>("cerrado");
  const [texto, setTexto] = useState("");
  const [momento, setMomento] = useState<string>(momentoSugerido());
  const [lista, setLista] = useState<AlimentoDesglosado[]>([]);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [gramos, setGramos] = useState(100);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cerrar() {
    setModo("cerrado");
    setTexto("");
    setLista([]);
    setProducto(null);
    setError(null);
  }

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
      setLista([...lista, ...datos.alimentos]);
      setTexto("");
      setModo("elegir");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado.");
    } finally {
      setCargando(false);
    }
  }

  const alLeer = useCallback(async (codigo: string) => {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/barras", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const datos = await r.json();
      if (!r.ok) throw new Error(datos.error);
      setProducto(datos.alimento);
      setGramos(100);
      setModo("producto");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado.");
      setModo("elegir");
    } finally {
      setCargando(false);
    }
  }, []);

  function anadirProducto() {
    if (!producto) return;
    const f = gramos / 100;
    setLista([
      ...lista,
      {
        nombre: producto.marca
          ? `${producto.nombre} (${producto.marca})`
          : producto.nombre,
        gramos,
        kcal: Math.round(producto.kcal_100 * f),
        prot_g: Math.round(producto.prot_100 * f * 10) / 10,
        carb_g: Math.round(producto.carb_100 * f * 10) / 10,
        grasa_g: Math.round(producto.grasa_100 * f * 10) / 10,
      },
    ]);
    setProducto(null);
    setModo("elegir");
  }

  async function guardar() {
    if (!lista.length) return;
    setCargando(true);
    const r = await guardarComida(momento, texto, lista, fecha);
    setCargando(false);
    if (r?.error) return setError(r.error);
    cerrar();
  }

  const total = lista.reduce((s, a) => s + a.kcal, 0);

  if (modo === "cerrado") {
    return (
      <button
        onClick={() => setModo("elegir")}
        className="w-full rounded-[18px] bg-[var(--color-naranja)] px-4 py-4 text-[15px] font-semibold text-white shadow-[var(--shadow-tarjeta)]"
      >
        + Apuntar una comida
      </button>
    );
  }

  return (
    <div className="tarjeta p-4 ring-2 ring-[var(--color-naranja)]">
      <div className="flex flex-wrap gap-1.5">
        {MOMENTOS.map((m) => (
          <button
            key={m}
            onClick={() => setMomento(m)}
            className={`rounded-full px-3 py-1.5 text-[12px] capitalize ${
              momento === m
                ? "bg-[var(--color-naranja)] text-white"
                : "bg-[var(--color-naranja-claro)] text-[#8a441c]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {lista.length > 0 && (
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

      {modo === "elegir" && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            onClick={() => setModo("texto")}
            className="rounded-lg border border-[var(--color-linea)] px-3 py-4 text-[13px]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" className="mx-auto">
              <path d="M4 6h16M4 11h16M4 16h10" />
            </svg>
            <span className="mt-1.5 block">Escribir</span>
          </button>
          <button
            onClick={() => setModo("escaner")}
            className="rounded-lg border border-[var(--color-linea)] px-3 py-4 text-[13px]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" className="mx-auto">
              <path d="M3 4.5v15M7 4.5v15M11 4.5v15M14.5 4.5v15M18 4.5v15M21 4.5v15" />
            </svg>
            <span className="mt-1.5 block">Código</span>
          </button>
          <button
            onClick={() => setModo("foto")}
            className="rounded-lg border border-[var(--color-linea)] px-3 py-4 text-[13px]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" className="mx-auto">
              <rect x="2.5" y="6" width="19" height="14" rx="3" />
              <circle cx="12" cy="13" r="4" />
              <path d="M8.5 6l1.5-2.5h4L15.5 6" />
            </svg>
            <span className="mt-1.5 block">Foto</span>
          </button>
        </div>
      )}

      {modo === "texto" && (
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
            Escríbelo como se lo contarías a alguien. En el móvil puedes dictarlo
            con el micro del teclado.
          </p>
          <button
            onClick={desglosar}
            disabled={cargando || texto.trim().length < 3}
            className="mt-3 w-full rounded-lg bg-[var(--color-pino)] px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
          >
            {cargando ? "Un momento…" : "Desglosar"}
          </button>
        </>
      )}

      {modo === "escaner" && (
        <Escaner alLeer={alLeer} alCerrar={() => setModo("elegir")} />
      )}

      {modo === "foto" && (
        <CapturaFoto
          alLeerEtiqueta={(p) => {
            setProducto(p);
            setGramos(100);
            setModo("producto");
          }}
          alLeerPlato={(a) => {
            setLista([...lista, ...a]);
            setModo("elegir");
          }}
          alFallar={(m) => {
            setError(m);
            setModo("elegir");
          }}
        />
      )}

      {modo === "producto" && producto && (
        <div className="mt-3">
          <div className="rounded-lg border border-[var(--color-linea)] px-3.5 py-3">
            <div className="text-[14px] font-medium">{producto.nombre}</div>
            {producto.marca && (
              <div className="text-[12px] text-[var(--color-tenue)]">{producto.marca}</div>
            )}
            <div className="cifra mt-1.5 text-[12px] text-[var(--color-tenue)]">
              {Math.round(producto.kcal_100)} kcal por 100 g
            </div>
          </div>

          <label className="mt-3 flex items-center gap-2 text-[13px]">
            Cantidad
            <input
              type="number"
              value={gramos}
              min={1}
              autoFocus
              onChange={(e) => setGramos(Number(e.target.value) || 0)}
              className="cifra w-24 rounded-lg border border-[var(--color-linea)] px-3 py-2 text-right"
            />
            g
            <span className="cifra ml-auto text-[13px] font-medium">
              {Math.round((producto.kcal_100 * gramos) / 100)} kcal
            </span>
          </label>

          <button
            onClick={anadirProducto}
            disabled={gramos < 1}
            className="mt-3 w-full rounded-lg bg-[var(--color-pino)] px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
          >
            Añadir
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      )}

      {modo !== "escaner" && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={modo === "elegir" ? cerrar : () => setModo("elegir")}
            className="rounded-lg border border-[var(--color-linea)] px-4 py-2.5 text-[14px]"
          >
            {modo === "elegir" ? "Cancelar" : "Volver"}
          </button>
          {lista.length > 0 && (
            <button
              onClick={guardar}
              disabled={cargando}
              className="flex-1 rounded-lg bg-[var(--color-pino)] px-4 py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
            >
              {cargando ? "Guardando…" : `Guardar ${lista.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
