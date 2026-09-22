"use client";

import { useActionState, useState } from "react";
import { crearHogar, unirse } from "./actions";

export default function Empezar() {
  const [modo, setModo] = useState<"crear" | "unir">("crear");
  const [error, enviar, pendiente] = useActionState(
    modo === "crear" ? crearHogar : unirse,
    null
  );

  return (
    <main className="min-h-dvh flex flex-col justify-center px-6 py-16 max-w-sm mx-auto">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight">
        {modo === "crear" ? "Monta tu casa" : "Entra en una casa"}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-tenue)]">
        {modo === "crear"
          ? "Creas la casa y repartes el código al resto."
          : "Pide el código a quien la haya creado."}
      </p>

      <div className="mt-6 flex rounded-lg border border-[var(--color-linea)] p-1">
        {(["crear", "unir"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModo(m)}
            className={`flex-1 rounded-md px-3 py-2 text-[13px] font-medium ${
              modo === m
                ? "bg-[var(--color-pino)] text-white"
                : "text-[var(--color-tenue)]"
            }`}
          >
            {m === "crear" ? "Crear" : "Tengo código"}
          </button>
        ))}
      </div>

      <form action={enviar} key={modo} className="mt-6 flex flex-col gap-4">
        {modo === "crear" ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Nombre de la casa</span>
            <input
              name="nombre"
              required
              placeholder="Los de la Patacona"
              className="rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3.5 py-3 text-[15px]"
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium">Código</span>
            <input
              name="codigo"
              required
              maxLength={6}
              placeholder="A7KD2M"
              className="rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3.5 py-3 text-[17px] uppercase tracking-[0.2em] cifra"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Tu nombre</span>
          <input
            name="mi_nombre"
            required
            className="rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3.5 py-3 text-[15px]"
          />
        </label>

        {error && (
          <p role="alert" className="text-[13px] text-[var(--color-alarma)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pendiente}
          className="mt-2 rounded-lg bg-[var(--color-pino)] px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-60"
        >
          {pendiente ? "Un momento…" : modo === "crear" ? "Crear la casa" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
