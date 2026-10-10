/**
 * Generador de Embeds con formato visual para Discord.
 */

import {
  obtenerDatosLol,
  obtenerEnPartida,
  obtenerRanking,
  obtenerDestacados,
} from "../datos.js";

/**
 * Genera el embed para el comando /quien-juega.
 */
export async function manejarQuienJuega() {
  const datos = await obtenerDatosLol();
  const enPartida = obtenerEnPartida(datos);

  if (enPartida.length === 0) {
    return {
      embeds: [
        {
          title: "🐸 LOLSapo — En partida",
          description: "Ningún sapo del grupo está en partida en este momento.",
          color: 0x34495e, // Gris / Azul oscuro
          footer: { text: "LOLSapoBot • Actualizado cada ~5 min" },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  const fields = enPartida.map((jugador) => ({
    name: `🟢 ${jugador.nombre}`,
    value: `• **Campeón:** ${jugador.campeon}\n• **Modo:** ${jugador.modo}\n• **Tiempo:** ~${jugador.tiempoMinutos} min${jugador.esGrupo ? " (👥 En grupo)" : ""}`,
    inline: true,
  }));

  return {
    embeds: [
      {
        title: `🎮 Amigos en Partida (${enPartida.length})`,
        color: 0x2ecc71, // Verde esmeralda
        fields,
        footer: { text: "LOLSapoBot • Datos en vivo" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Genera el embed para el comando /ranking.
 */
export async function manejarRanking() {
  const datos = await obtenerDatosLol();
  const ranking = obtenerRanking(datos);

  if (ranking.length === 0) {
    return {
      embeds: [
        {
          title: "🏆 LOLSapo — Ranking",
          description: "No hay amigos registrados en el ranking todavía.",
          color: 0xe67e22,
        },
      ],
    };
  }

  const lineas = ranking.map((amigo) => {
    const medalla = amigo.posicion === 1 ? "🥇" : amigo.posicion === 2 ? "🥈" : amigo.posicion === 3 ? "🥉" : `**#${amigo.posicion}**`;
    return `${medalla} **${amigo.nombre}** (Nivel ${amigo.nivel})\n   • **SoloQ:** ${amigo.rangoSolo} | **Flex:** ${amigo.rangoFlex}\n   • **Winrate:** ${amigo.winrate} (${amigo.partidas} partidas: ${amigo.victorias}V / ${amigo.derrotas}D)\n`;
  });

  return {
    embeds: [
      {
        title: "🏆 Tabla de Clasificación del Grupo",
        description: lineas.join("\n"),
        color: 0xf1c40f, // Dorado
        footer: { text: "LOLSapoBot • Ranking oficial de amigos" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Genera el embed para el comando /destacados.
 */
export async function manejarDestacados() {
  const datos = await obtenerDatosLol();
  const destacados = obtenerDestacados(datos);

  const fields = [];

  if (destacados.mejorJugadorHoy) {
    const m = destacados.mejorJugadorHoy;
    fields.push({
      name: "👑 Mejor Jugador de Hoy (MVP)",
      value: `**${m.amigo ?? m.nombre}** con **${m.campeon ?? "campeón"}**\n• KDA: **${m.kda ?? "-"}**${m.danio ? `\n• Daño: ${m.danio.toLocaleString()}` : ""}`,
      inline: false,
    });
  } else {
    fields.push({
      name: "👑 Mejor Jugador de Hoy",
      value: "Sin partidas registradas hoy aún.",
      inline: false,
    });
  }

  if (destacados.peorJugadorHoy) {
    const p = destacados.peorJugadorHoy;
    fields.push({
      name: "💀 Peor Jugador de Hoy",
      value: `**${p.amigo ?? p.nombre}** con **${p.campeon ?? "campeón"}**\n• KDA: **${p.kda ?? "-"}**${p.danio ? `\n• Daño: ${p.danio.toLocaleString()}` : ""}`,
      inline: false,
    });
  }

  if (destacados.balanceHoy) {
    const b = destacados.balanceHoy;
    fields.push({
      name: "⚖️ Balance del Grupo Hoy",
      value: `**${b.victorias} Victorias** — **${b.derrotas} Derrotas**${b.porcentaje != null ? ` (${b.porcentaje}% WR)` : ""}`,
      inline: false,
    });
  }

  if (destacados.rachaVictorias && destacados.rachaVictorias.partidas > 1) {
    fields.push({
      name: "🔥 Racha de Victorias",
      value: `${destacados.rachaVictorias.partidas} seguidas`,
      inline: true,
    });
  }

  return {
    embeds: [
      {
        title: "⭐ Destacados de la Jornada — LOLSapo",
        color: 0x9b59b6, // Morado
        fields,
        footer: { text: "LOLSapoBot • Se reinicia a las 12:00 Chile" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
