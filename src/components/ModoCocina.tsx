"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mantiene la pantalla encendida mientras cocinas.
 * Si el navegador no lo soporta, el botón no aparece y ya está.
 */
export function ModoCocina() {
  const [activo, setActivo] = useState(false);
  const [hay, setHay] = useState(false);
  const bloqueo = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setHay("wakeLock" in navigator);
    return () => {
      bloqueo.current?.release().catch(() => {});
    };
  }, []);

  // Al volver de otra app el bloqueo se pierde: hay que rehacerlo.
  useEffect(() => {
    function alVolver() {
      if (activo && document.visibilityState === "visible") pedir();
    }
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [activo]);

  async function pedir() {
    try {
      bloqueo.current = await navigator.wakeLock.request("screen");
      setActivo(true);
    } catch {
      setActivo(false);
    }
  }

  async function soltar() {
    await bloqueo.current?.release().catch(() => {});
    bloqueo.current = null;
    setActivo(false);
  }

  if (!hay) return null;

  return (
    <button
      onClick={activo ? soltar : pedir}
      className={`w-full rounded-xl px-4 py-3 text-[14px] font-medium ${
        activo
          ? "bg-[var(--color-pino)] text-white"
          : "border border-[var(--color-linea)]"
      }`}
    >
      {activo ? "Pantalla encendida · tocar para soltar" : "Mantener pantalla encendida"}
    </button>
  );
}
