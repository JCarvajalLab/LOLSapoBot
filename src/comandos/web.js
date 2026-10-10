/**
 * Manejador del comando /web
 * Devuelve un embed estilizado con botón de enlace directo a LOLSapo en GitHub Pages.
 */

export const URL_LOLSAPO_WEB = "https://jcarvajallab.github.io/LOLSapo/";

export function manejarComandoWeb() {
  return {
    embeds: [
      {
        title: "🐸 LOLSapo — Web Oficial",
        description:
          "Accede a la plataforma web para ver historiales completos de partidas, sinergias de dúo, clasificaciones de LoL/TFT y estadísticas detalladas del grupo.",
        color: 0x00bcd4, // Turquesa / Cyan
        fields: [
          {
            name: "🌐 Sitio Web",
            value: `[jcarvajallab.github.io/LOLSapo](${URL_LOLSAPO_WEB})`,
            inline: true,
          },
          {
            name: "⏱️ Frecuencia",
            value: "Se actualiza automáticamente cada ~5 minutos",
            inline: true,
          },
        ],
        footer: {
          text: "LOLSapo • Servidor LAS",
        },
      },
    ],
    components: [
      {
        type: 1, // ActionRow
        components: [
          {
            type: 2, // Button
            style: 5, // Link Button
            label: "🌐 Abrir LOLSapo Web",
            url: URL_LOLSAPO_WEB,
          },
        ],
      },
    ],
  };
}
