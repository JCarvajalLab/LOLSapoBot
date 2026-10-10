/**
 * Manejador del comando /destacados con selector interactivo de Top 5.
 * Admite períodos: 'hoy', 'semana', 'mes'.
 */

import { obtenerDatosLol } from "../datos.js";

const MAPA_TITULOS_TOP = {
  mejor_jugador_hoy: "👑 Top 5 — Mejor Jugador de Hoy",
  peor_jugador_hoy: "💀 Top 5 — Peor Jugador de Hoy",
  balance_hoy: "⚖️ Top 5 — Balance de Hoy",
  mejor_jugador_semana: "👑 Top 5 — Mejor Jugador de la Semana",
  peor_jugador_semana: "💀 Top 5 — Peor Jugador de la Semana",
  mejor_winrate: "🔥 Top 5 — Mejor Winrate de la Semana",
  mas_partidas: "🎮 Top 5 — Más Partidas de la Semana",
  mejor_jugador_mes: "👑 Top 5 — Mejor Jugador del Mes",
  peor_jugador_mes: "💀 Top 5 — Peor Jugador del Mes",
  balance_mes: "⚖️ Top 5 — Balance del Mes",
};

function resolverNombreAmigo(amigoSlug, mapaAmigos) {
  if (!amigoSlug) return "Desconocido";
  const slugLimpio = Array.isArray(amigoSlug) ? amigoSlug[0] : amigoSlug;
  const encontrado = mapaAmigos.get(slugLimpio);
  return encontrado?.nombre ?? slugLimpio;
}

/**
 * Genera la respuesta del comando /destacados según el período.
 *
 * @param {"hoy" | "semana" | "mes"} periodo
 */
export async function manejarComandoDestacados(periodo = "hoy") {
  const datos = await obtenerDatosLol();
  const d = datos.destacados ?? {};

  if (periodo === "semana") {
    return generarDestacadosSemana(d);
  }
  if (periodo === "mes") {
    return generarDestacadosMes(d);
  }
  return generarDestacadosHoy(d);
}

function generarDestacadosHoy(d) {
  const fields = [];

  if (d.mejor_jugador_hoy) {
    const m = d.mejor_jugador_hoy;
    fields.push({
      name: "👑 Mejor Jugador de Hoy (MVP)",
      value: `**${m.amigo ?? m.nombre}** (${m.campeon})\n• KDA: **${m.kda}** (${m.asesinatos}/${m.muertes}/${m.asistencias})\n• Daño: **${m.danio?.toLocaleString() ?? "-"}**`,
      inline: false,
    });
  } else {
    fields.push({
      name: "👑 Mejor Jugador de Hoy",
      value: "No hay partidas en grupo registradas hoy.",
      inline: false,
    });
  }

  if (d.peor_jugador_hoy) {
    const p = d.peor_jugador_hoy;
    fields.push({
      name: "💀 Peor Jugador de Hoy",
      value: `**${p.amigo ?? p.nombre}** (${p.campeon})\n• KDA: **${p.kda}** (${p.asesinatos}/${p.muertes}/${p.asistencias})\n• Daño: **${p.danio?.toLocaleString() ?? "-"}**`,
      inline: false,
    });
  }

  if (d.balance_hoy) {
    const b = d.balance_hoy;
    fields.push({
      name: "⚖️ Balance del Grupo Hoy",
      value: `**${b.victorias}V — ${b.derrotas}D**${b.porcentaje != null ? ` (${b.porcentaje}% WR)` : ""}`,
      inline: false,
    });
  }

  return {
    embeds: [
      {
        title: "⭐ Destacados de Hoy — LOLSapo",
        description: "Resumen de las partidas en grupo jugadas hoy (se reinicia a las 12:00 Chile).",
        color: 0x9b59b6, // Morado
        fields,
        footer: { text: "Usa el menú inferior para ver el Top 5 de cada categoría" },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      {
        type: 1, // ActionRow
        components: [
          {
            type: 3, // StringSelect
            custom_id: "select_top5_hoy",
            placeholder: "🔽 Selecciona una categoría para ver el Top 5...",
            options: [
              { label: "Mejor Jugador de Hoy", value: "mejor_jugador_hoy", emoji: { name: "👑" } },
              { label: "Peor Jugador de Hoy", value: "peor_jugador_hoy", emoji: { name: "💀" } },
            ],
          },
        ],
      },
    ],
  };
}

function generarDestacadosSemana(d) {
  const fields = [];

  if (d.mejor_jugador_semana) {
    const m = d.mejor_jugador_semana;
    fields.push({
      name: "👑 Mejor Jugador de la Semana",
      value: `**${m.amigo ?? m.nombre}** (${m.campeon})\n• KDA: **${m.kda}** (${m.asesinatos}/${m.muertes}/${m.asistencias})\n• Daño: **${m.danio?.toLocaleString() ?? "-"}**`,
      inline: false,
    });
  }

  if (d.peor_jugador_semana) {
    const p = d.peor_jugador_semana;
    fields.push({
      name: "💀 Peor Jugador de la Semana",
      value: `**${p.amigo ?? p.nombre}** (${p.campeon})\n• KDA: **${p.kda}** (${p.asesinatos}/${p.muertes}/${p.asistencias})\n• Daño: **${p.danio?.toLocaleString() ?? "-"}**`,
      inline: false,
    });
  }

  if (d.mejor_winrate) {
    const wr = d.mejor_winrate;
    fields.push({
      name: "🔥 Mejor Winrate de la Semana",
      value: `**${wr.amigos?.join(", ") ?? wr.amigo}** con **${wr.winrate}%** (${wr.partidas} partidas)`,
      inline: true,
    });
  }

  if (d.mas_partidas) {
    const mp = d.mas_partidas;
    fields.push({
      name: "🎮 Más Partidas en Equipo",
      value: `**${mp.amigos?.join(", ") ?? mp.amigo}** con **${mp.partidas}** partidas`,
      inline: true,
    });
  }

  return {
    embeds: [
      {
        title: "🗓️ Destacados de la Semana — LOLSapo",
        description: "Partidas en grupo de lunes a domingo (se reinicia el lunes a la 01:00 Chile).",
        color: 0x3498db, // Azul
        fields,
        footer: { text: "Usa el menú inferior para ver el Top 5 de cada categoría" },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: "select_top5_semana",
            placeholder: "🔽 Selecciona una categoría para ver el Top 5 de la semana...",
            options: [
              { label: "Mejor Jugador de la Semana", value: "mejor_jugador_semana", emoji: { name: "👑" } },
              { label: "Peor Jugador de la Semana", value: "peor_jugador_semana", emoji: { name: "💀" } },
              { label: "Mejor Winrate", value: "mejor_winrate", emoji: { name: "🔥" } },
              { label: "Más Partidas", value: "mas_partidas", emoji: { name: "🎮" } },
            ],
          },
        ],
      },
    ],
  };
}

function generarDestacadosMes(d) {
  const fields = [];

  if (d.mejor_jugador_mes) {
    const m = d.mejor_jugador_mes;
    fields.push({
      name: "👑 Mejor Jugador del Mes",
      value: `**${m.amigo ?? m.nombre}** (${m.campeon}) — KDA: **${m.kda}**`,
      inline: false,
    });
  }

  if (d.peor_jugador_mes) {
    const p = d.peor_jugador_mes;
    fields.push({
      name: "💀 Peor Jugador del Mes",
      value: `**${p.amigo ?? p.nombre}** (${p.campeon}) — KDA: **${p.kda}**`,
      inline: false,
    });
  }

  if (d.balance_mes) {
    const b = d.balance_mes;
    fields.push({
      name: "⚖️ Balance del Mes",
      value: `**${b.victorias}V — ${b.derrotas}D** (${b.porcentaje ?? 0}% WR)`,
      inline: false,
    });
  }

  return {
    embeds: [
      {
        title: "📆 Destacados del Mes — LOLSapo",
        description: "Acumulado mensual del grupo.",
        color: 0xe67e22, // Naranja
        fields,
        footer: { text: "Usa el menú inferior para ver el Top 5 del mes" },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: "select_top5_mes",
            placeholder: "🔽 Selecciona una categoría para ver el Top 5 del mes...",
            options: [
              { label: "Mejor Jugador del Mes", value: "mejor_jugador_mes", emoji: { name: "👑" } },
              { label: "Peor Jugador del Mes", value: "peor_jugador_mes", emoji: { name: "💀" } },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Responde a la interacción de selección en el menú desplegable para mostrar el Top 5.
 *
 * @param {string} categoria Clave seleccionada (ej: 'mejor_jugador_semana')
 */
export async function manejarSeleccionTop5(categoria) {
  const datos = await obtenerDatosLol();
  const d = datos.destacados ?? {};
  const tops = d.tops ?? {};
  const lista = tops[categoria] ?? [];

  const mapaAmigos = new Map();
  for (const a of datos.amigos ?? []) {
    if (a.slug) mapaAmigos.set(a.slug, a);
    if (a.riot_id) mapaAmigos.set(a.riot_id, a);
  }

  const titulo = MAPA_TITULOS_TOP[categoria] ?? "🏆 Ranking Top 5";

  if (lista.length === 0) {
    return {
      embeds: [
        {
          title,
          description: "No existen suficientes partidas registradas en equipo para este Top 5.",
          color: 0x95a5a6,
        },
      ],
    };
  }

  const medallas = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
  const lineas = lista.map((item, idx) => {
    const medalla = medallas[idx] ?? `#${idx + 1}`;
    const nombre = resolverNombreAmigo(item.amigos ?? item.amigo, mapaAmigos);

    if (item.kda != null) {
      const resultadoIcono = item.resultado === "victoria" ? "✅" : "❌";
      return `${medalla} **${nombre}** (${item.campeon ?? "Campeón"})\n   • KDA: **${item.kda}** (${item.asesinatos}/${item.muertes}/${item.asistencias}) | Daño: **${item.danio?.toLocaleString() ?? "-"}** ${resultadoIcono}`;
    }

    if (item.winrate != null) {
      return `${medalla} **${nombre}** — Winrate: **${item.winrate}%** (${item.partidas} partidas)`;
    }

    if (item.partidas != null) {
      return `${medalla} **${nombre}** — **${item.partidas}** partidas jugadas`;
    }

    return `${medalla} **${nombre}**`;
  });

  return {
    embeds: [
      {
        title,
        description: lineas.join("\n\n"),
        color: 0xf1c40f, // Dorado
        footer: { text: "LOLSapoBot • Top 5 oficial" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
