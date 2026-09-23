/**
 * Avisos por correo para el administrador.
 *
 * Va con Resend. Si no hay clave configurada, no se envía nada y la
 * app sigue funcionando: un aviso que falla nunca debe tumbar la
 * operación que lo provocó.
 */

function base(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const v = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return v ? `https://${v}` : "";
}

export async function avisar(asunto: string, cuerpo: string, enlace?: string) {
  const clave = process.env.RESEND_API_KEY;
  const destino = process.env.AVISOS_EMAIL;
  if (!clave || !destino) return;

  const url = enlace ? `${base()}${enlace}` : null;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;color:#17241d">
      <div style="background:#1f6a4c;color:#fff;padding:18px 20px;border-radius:12px 12px 0 0">
        <strong style="font-size:17px">Mesa</strong>
      </div>
      <div style="border:1px solid #ece3d6;border-top:none;border-radius:0 0 12px 12px;padding:20px">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.55">${cuerpo}</p>
        ${
          url
            ? `<a href="${url}" style="display:inline-block;background:#f2762e;color:#fff;
                 text-decoration:none;padding:11px 18px;border-radius:9px;font-size:14px;
                 font-weight:600">Abrir el panel</a>`
            : ""
        }
      </div>
    </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${clave}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.AVISOS_DESDE ?? "Mesa <onboarding@resend.dev>",
        to: [destino],
        subject: asunto,
        html,
      }),
    });
    if (!r.ok) console.error("Resend:", r.status, await r.text());
  } catch (e) {
    console.error("Aviso no enviado:", e);
  }
}
