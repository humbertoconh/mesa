"use client";

import { useActionState, useState } from "react";
import { entrar, registrarse } from "./actions";

export default function Entrar() {
  const [nuevo, setNuevo] = useState(false);
  const accion = nuevo ? registrarse : entrar;
  const [error, enviar, pendiente] = useActionState(accion, null);

  return (
    <main className="min-h-dvh flex flex-col justify-center px-6 py-16 max-w-sm mx-auto">
      <h1 className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-none">
        Mesa
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-tenue)]">
        Lo que come la casa, contado entre todos.
      </p>

      <form action={enviar} className="mt-10 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Correo</span>
          <input
            name="correo"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-[var(--color-linea)] bg-[var(--color-loza)] px-3.5 py-3 text-[15px]"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Contraseña</span>
          <input
            name="clave"
            type="password"
            required
            autoComplete={nuevo ? "new-password" : "current-password"}
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
          {pendiente ? "Un momento…" : nuevo ? "Crear cuenta" : "Entrar"}
        </button>
      </form>

      <button
        onClick={() => setNuevo(!nuevo)}
        className="mt-6 text-[13px] text-[var(--color-tenue)] underline underline-offset-4"
      >
        {nuevo ? "Ya tengo cuenta" : "Todavía no tengo cuenta"}
      </button>
    </main>
  );
}
