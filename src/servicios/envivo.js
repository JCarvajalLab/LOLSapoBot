/**
 * Servicio de gestión de alertas de partidas en grupo en vivo (/envivo).
 */

// Almacenamiento en memoria para desarrollo local si no hay Cloudflare KV configurado
const estadoLocal = new Map();

/**
 * Activa o desactiva las alertas automáticas para un canal de Discord.
 *
 * @param {string} canalId ID del canal de Discord donde se ejecutó el comando
 * @param {object} [env] Variables de entorno / bindings de Cloudflare (ej: env.LOLSAPO_KV)
 * @returns {Promise<{ activo: boolean, mensaje: string }>}
 */
export async function toggleCanalEnVivo(canalId, env = {}) {
  let configuracion = null;

  if (env.LOLSAPO_KV) {
    const raw = await env.LOLSAPO_KV.get(`envivo_${canalId}`);
    if (raw) configuracion = JSON.parse(raw);
  } else {
    configuracion = estadoLocal.get(canalId);
  }

  const estaActivo = configuracion?.activo ?? false;
  const nuevoEstado = !estaActivo;

  const nuevaConfig = {
    activo: nuevoEstado,
    canalId,
    partidaId: configuracion?.partidaId ?? null,
    mensajeId: configuracion?.mensajeId ?? null,
    actualizadoEn: new Date().toISOString(),
  };

  if (env.LOLSAPO_KV) {
    await env.LOLSAPO_KV.put(`envivo_${canalId}`, JSON.stringify(nuevaConfig));
  } else {
    estadoLocal.set(canalId, nuevaConfig);
  }

  if (nuevoEstado) {
    return {
      activo: true,
      mensaje:
        "🔴 **Alertas automáticas de partidas en grupo ACTIVADAS en este canal.**\n" +
        "• Solo notificará cuando **2 o más amigos** jueguen juntos en el mismo equipo (Normal / Ranked).\n" +
        "• Al finalizar la partida, el mensaje se actualizará automáticamente con el resultado (Victoria o Derrota).",
    };
  }

  return {
    activo: false,
    mensaje: "⏸️ **Alertas automáticas de partidas en grupo PAUSADAS en este canal.**",
  };
}

/**
 * Genera el embed inicial cuando se detecta una partida en grupo en curso.
 *
 * @param {object} datosPartida Información de la partida en vivo
 */
export function crearEmbedPartidaEnGrupo(datosPartida) {
  const amigos = datosPartida.amigos ?? [];
  const modo = datosPartida.modo ?? "Partida Normal/Ranked";
  const tiempoMinutos = Math.floor((datosPartida.tiempo ?? 0) / 60);

  const listaAmigos = amigos.map(
    (a) => `• **${a.nombre}** jugando con **${a.campeon}**`
  ).join("\n");

  return {
    title: "🎮 ¡Los Sapos entraron a partida en equipo!",
    description: `Partida de **${modo}** en curso [⏱️ ~${tiempoMinutos} min].`,
    color: 0x2ecc71, // Verde en vivo
    fields: [
      {
        name: `👥 Amigos en el mismo equipo (${amigos.length})`,
        value: listaAmigos || "Amigos no identificados",
        inline: false,
      },
    ],
    footer: {
      text: "LOLSapoBot • Esta tarjeta se actualizará al terminar la partida",
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Genera el embed de resultado final para EDITAR el mensaje original al terminar la partida.
 *
 * @param {object} resultadoPartida Resumen de la partida terminada
 */
export function crearEmbedPartidaFinalizada(resultadoPartida) {
  const gano = resultadoPartida.resultado === "victoria";
  const duracionMin = Math.floor((resultadoPartida.duracion ?? 0) / 60);
  const duracionSeg = (resultadoPartida.duracion ?? 0) % 60;
  const amigos = resultadoPartida.amigos ?? [];

  const listaActuaciones = amigos.map((a) => {
    const kda = a.muertes === 0 ? a.asesinatos + a.asistencias : ((a.asesinatos + a.asistencias) / a.muertes).toFixed(1);
    return `• **${a.nombre}** (${a.campeon}) — KDA: **${kda}** (${a.asesinatos}/${a.muertes}/${a.asistencias}) | Daño: ${a.danio?.toLocaleString() ?? "-"}`;
  }).join("\n");

  return {
    title: gano ? "🏆 ¡Victoria en Equipo!" : "💀 Derrota en Equipo",
    description: `Partida de **${resultadoPartida.modo ?? "LoL"}** finalizada tras **${duracionMin}m ${duracionSeg}s**.`,
    color: gano ? 0x2ecc71 : 0xe74c3c, // Verde si gana, Rojo si pierde
    fields: [
      {
        name: "📊 Actuación del Grupo",
        value: listaActuaciones || "Sin datos de jugadores",
        inline: false,
      },
    ],
    footer: {
      text: "LOLSapoBot • Partida finalizada",
    },
    timestamp: new Date().toISOString(),
  };
}
