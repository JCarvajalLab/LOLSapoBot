/**
 * LOLSapoBot — Cloudflare Worker
 * Maneja las interacciones HTTP de Discord.
 */

import {
  validarFirmaDiscord,
  InteractionType,
  InteractionResponseType,
} from "./seguridad.js";

export default {
  /**
   * Punto de entrada HTTP del Worker.
   * @param {Request} request Petición entrante
   * @param {object} env Variables de entorno y secretos (DISCORD_PUBLIC_KEY, etc.)
   * @param {object} ctx Contexto de ejecución
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    // Si alguien entra por GET en el navegador, devolvemos un mensaje informativo
    if (request.method !== "POST") {
      return new Response("🐸 LOLSapoBot activo. Esperando interacciones de Discord vía HTTP POST.", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    const rawBody = await request.text();

    // 🔒 Validación estricta de firma criptográfica Ed25519
    const esValida = await validarFirmaDiscord(
      rawBody,
      signature,
      timestamp,
      env?.DISCORD_PUBLIC_KEY
    );

    if (!esValida) {
      return new Response("Firma no autorizada o ausente", { status: 401 });
    }

    let interaccion;
    try {
      interaccion = JSON.parse(rawBody);
    } catch {
      return new Response("Cuerpo JSON inválido", { status: 400 });
    }

    // 🏓 Discord PING (Tipo 1) -> Responder PONG (Tipo 1) para validar endpoint
    if (interaccion.type === InteractionType.PING) {
      return new Response(
        JSON.stringify({ type: InteractionResponseType.PONG }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Comandos slash (Tipo 2) - se implementarán en Fase 3 y 4
    if (interaccion.type === InteractionType.APPLICATION_COMMAND) {
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "🐸 Comando recibido por LOLSapoBot (en construcción).",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Tipo de interacción desconocido", { status: 400 });
  },
};
