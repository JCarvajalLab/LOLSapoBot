import { verifyKey, InteractionType, InteractionResponseType } from "discord-interactions";

/**
 * Valida la firma criptográfica Ed25519 de una petición entrante de Discord.
 *
 * Discord requiere validar la firma sobre: `${timestamp}${rawBody}`
 * usando la clave pública pública de la aplicación.
 *
 * @param {string} rawBody Cuerpo crudo de la petición
 * @param {string | null} signature Cabecera X-Signature-Ed25519
 * @param {string | null} timestamp Cabecera X-Signature-Timestamp
 * @param {string | undefined} publicKey DISCORD_PUBLIC_KEY configurada
 * @returns {Promise<boolean>} true si la firma es válida, false en caso contrario
 */
export async function validarFirmaDiscord(rawBody, signature, timestamp, publicKey) {
  if (!signature || !timestamp || !publicKey) {
    return false;
  }

  try {
    const esValida = await verifyKey(rawBody, signature, timestamp, publicKey);
    return Boolean(esValida);
  } catch {
    return false;
  }
}

export { InteractionType, InteractionResponseType };
