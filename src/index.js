/**
 * LOLSapoBot — Cloudflare Worker
 * Maneja las interacciones HTTP de Discord.
 */

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

    // El manejo de firmas Ed25519 e interacciones de Discord se implementará en la Fase 2
    return new Response(JSON.stringify({ message: "Endpoint base listo" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};

