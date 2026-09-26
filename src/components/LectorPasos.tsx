"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lee los pasos en voz alta con la síntesis del propio navegador.
 * No cuesta nada y funciona sin conexión.
 *
 * Lee un paso y se para. No encadena solo a propósito: en la cocina
 * necesitas el tiempo de hacer lo que te acaba de decir.
 */
export function LectorPasos({ pasos }: { pasos: string[] }) {
  const [actual, setActual] = useState(0);
  const [leyendo, setLeyendo] = useState(false);
  const [hayVoz, setHayVoz] = useState(false);
  const voz = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setHayVoz(true);

    function elegirVoz() {
      const voces = window.speechSynthesis.getVoices();
      // Primero una de España; si no, cualquiera en español.
      voz.current =
        voces.find((v) => v.lang === "es-ES") ??
        voces.find((v) => v.lang.startsWith("es")) ??
        null;
    }

    elegirVoz();
    // En algunos navegadores las voces tardan en cargar.
    window.speechSynthesis.addEventListener("voiceschanged", elegirVoz);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", elegirVoz);
      window.speechSynthesis.cancel();
    };
  }, []);

  function leer(i: number) {
    if (!hayVoz || !pasos[i]) return;
    window.speechSynthesis.cancel();

    const frase = new SpeechSynthesisUtterance(`Paso ${i + 1}. ${pasos[i]}`);
    if (voz.current) frase.voice = voz.current;
    frase.lang = "es-ES";
    frase.rate = 0.95;
    frase.onend = () => setLeyendo(false);
    frase.onerror = () => setLeyendo(false);

    setActual(i);
    setLeyendo(true);
    window.speechSynthesis.speak(frase);
  }

  function parar() {
    window.speechSynthesis.cancel();
    setLeyendo(false);
  }

  return (
    <>
      <ol className="mt-3 flex flex-col gap-2.5">
        {pasos.map((paso, i) => {
          const activo = i === actual;
          return (
            <li key={i}>
              <button
                onClick={() => (leyendo && activo ? parar() : leer(i))}
                disabled={!hayVoz}
                className={`flex w-full gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  activo && hayVoz ? "bg-[var(--color-pino-claro)]" : ""
                }`}
              >
                <span
                  className={`cifra grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
                    activo && hayVoz
                      ? "bg-[var(--color-pino)] text-white"
                      : "bg-[var(--color-pino-claro)] text-[var(--color-pino)]"
                  }`}
                >
                  {leyendo && activo ? "❙❙" : i + 1}
                </span>
                <span className="text-[14px] leading-relaxed">{paso}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {hayVoz && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => (leyendo ? parar() : leer(actual))}
            className="flex-1 rounded-xl bg-[var(--color-pino)] px-4 py-3 text-[14px] font-medium text-white"
          >
            {leyendo ? "Parar" : `Leer el paso ${actual + 1}`}
          </button>
          <button
            onClick={() => leer(Math.min(actual + 1, pasos.length - 1))}
            disabled={actual >= pasos.length - 1}
            className="rounded-xl border border-[var(--color-linea)] px-4 py-3 text-[14px] disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}

      <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-tenue)]">
        {hayVoz
          ? "Toca cualquier paso para que te lo lea. Lee uno y se para, para darte tiempo a hacerlo."
          : "Este navegador no puede leer en voz alta."}
      </p>
    </>
  );
}
