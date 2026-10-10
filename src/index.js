/**
 * LOLSapoBot — Cloudflare Worker
 * Maneja las interacciones HTTP de Discord, comandos slash y componentes interactivos.
 */

import {
  validarFirmaDiscord,
  InteractionType,
  InteractionResponseType,
} from "./seguridad.js";
import { manejarComandoWeb } from "./comandos/web.js";
import {
  manejarComandoDestacados,
  manejarSeleccionTop5,
} from "./comandos/destacados.js";
import { manejarQuienJuega } from "./comandos/embeds.js";
import { toggleCanalEnVivo } from "./servicios/envivo.js";

export default {
  /**
   * Punto de entrada HTTP del Worker.
   * @param {Request} request Petición entrante
   * @param {object} env Variables de entorno y secretos
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
        let respuestaData;

        if (nombreComando === "web") {
          respuestaData = manejarComandoWeb();
        } else if (nombreComando === "envivo") {
          const canalId = interaccion.channel_id ?? interaccion.channel?.id ?? "canal_desconocido";
          const res = await toggleCanalEnVivo(canalId, env);
          respuestaData = { content: res.mensaje };
        } else if (nombreComando === "destacados") {
          const periodo =
            interaccion.data?.options?.find((opt) => opt.name === "periodo")?.value ?? "hoy";
          respuestaData = await manejarComandoDestacados(periodo);
        } else if (nombreComando === "quien-juega") {
          respuestaData = await manejarQuienJuega();
        } else {
          respuestaData = { content: `⚠️ Comando no reconocido: /${nombreComando}` };
        }

        return new Response(
          JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: respuestaData,
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

    // 🔽 Interacción con Componentes (Tipo 3) — Selector de Top 5
    if (interaccion.type === InteractionType.MESSAGE_COMPONENT) {
      const customId = interaccion.data?.custom_id;

      if (customId?.startsWith("select_top5_")) {
        const categoriaSeleccionada = interaccion.data?.values?.[0];
        try {
          const respuestaTop5 = await manejarSeleccionTop5(categoriaSeleccionada);
          // Tipo 7 = UPDATE_MESSAGE (actualiza el mensaje existente en Discord)
          return new Response(
            JSON.stringify({
              type: InteractionResponseType.UPDATE_MESSAGE,
              data: respuestaTop5,
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
              data: { content: `⚠️ Error al cargar el Top 5: ${error.message}` },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    return new Response("Tipo de interacción desconocido", { status: 400 });
  },
};
