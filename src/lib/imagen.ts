/**
 * Reduce una foto antes de subirla o mandarla a la IA.
 * Del móvil salen de 4 MB y con 1.200 px de lado sobra.
 */
export async function reducir(
  archivo: File,
  max = 1200,
  calidad = 0.82
): Promise<{ base64: string; blob: Blob; tipo: string }> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);

  const lienzo = document.createElement("canvas");
  lienzo.width = w;
  lienzo.height = h;
  lienzo.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const url = lienzo.toDataURL("image/jpeg", calidad);
  const base64 = url.split(",")[1];

  const bytes = atob(base64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);

  return { base64, blob: new Blob([buf], { type: "image/jpeg" }), tipo: "image/jpeg" };
}

/** Recorta al cuadrado y reduce: para las miniaturas de las recetas. */
export async function cuadrada(archivo: File, lado = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo);
  const corte = Math.min(bitmap.width, bitmap.height);
  const x = (bitmap.width - corte) / 2;
  const y = (bitmap.height - corte) / 2;

  const lienzo = document.createElement("canvas");
  lienzo.width = lado;
  lienzo.height = lado;
  lienzo.getContext("2d")!.drawImage(bitmap, x, y, corte, corte, 0, 0, lado, lado);
  bitmap.close();

  return new Promise((resolve) =>
    lienzo.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
  );
}
