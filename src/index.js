/**
 * LOLSapoBot — Cloudflare Worker
 * Maneja las interacciones HTTP de Discord y responde a comandos slash.
 */

import {
  validarFirmaDiscord,
  InteractionType,
  InteractionResponseType,
} from "./seguridad.js";
import {
  manejarQuienJuega,
  manejarRanking,
  manejarDestacados,
} from "./comandos/embeds.js";

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

    // ⚡ Comandos Slash (Tipo 2)
    if (interaccion.type === InteractionType.APPLICATION_COMMAND) {
      const nombreComando = interaccion.data?.name;

      try {
        let respuestaEmbed;
        if (nombreComando === "quien-juega") {
          respuestaEmbed = await manejarQuienJuega();
        } else if (nombreComando === "ranking") {
          respuestaEmbed = await manejarRanking();
        } else if (nombreComando === "destacados") {
          respuestaEmbed = await manejarDestacados();
        } else {
          return new Response(
            JSON.stringify({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: { content: `⚠️ Comando no reconocido: /${nombreComando}` },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: respuestaEmbed,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `⚠️ Error al consultar datos de LOLSapo: ${error.message}`,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response("Tipo de interacción desconocido", { status: 400 });
  },
};
