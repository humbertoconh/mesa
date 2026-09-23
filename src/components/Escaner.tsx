"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lector de códigos de barras con la cámara.
 *
 * Safari no trae la API nativa del navegador (ni en Mac ni en iPhone),
 * así que tiramos de la librería, que funciona igual en todas partes.
 */
export function Escaner({
  alLeer,
  alCerrar,
}: {
  alLeer: (codigo: string) => void;
  alCerrar: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let parar = false;
    let stream: MediaStream | null = null;

    (async () => {
      try {
        const { BarcodeDetector } = await import("barcode-detector/ponyfill");
        const detector = new BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (parar) return;
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        }

        // Miramos cuatro veces por segundo: más es gastar batería para nada.
        while (!parar) {
          if (video.current?.readyState === 4) {
            try {
              const codigos = await detector.detect(video.current);
              if (codigos.length && codigos[0].rawValue) {
                parar = true;
                if (navigator.vibrate) navigator.vibrate(60);
                alLeer(codigos[0].rawValue);
                break;
              }
            } catch {
              // Un fotograma borroso falla: no es motivo para parar.
            }
          }
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch (e) {
        const msg =
          e instanceof Error && e.name === "NotAllowedError"
            ? "Hay que dar permiso de cámara para leer el código."
            : "No se ha podido abrir la cámara.";
        setError(msg);
      }
    })();

    return () => {
      parar = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [alLeer]);

  return (
    <div className="mt-3">
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video
          ref={video}
          playsInline
          muted
          className="h-[220px] w-full object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-1/2 h-[2px] -translate-y-1/2 bg-[var(--color-pino)] opacity-80"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-[var(--color-alarma)]">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-[12px] text-[var(--color-tenue)]">
          Acerca el código de barras hasta que la línea lo cruce.
        </p>
      )}

      <button
        onClick={alCerrar}
        className="mt-3 w-full rounded-lg border border-[var(--color-linea)] px-4 py-2.5 text-[14px]"
      >
        Cancelar
      </button>
    </div>
  );
}
