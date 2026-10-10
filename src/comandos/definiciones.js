/**
 * Definiciones oficiales de los comandos Slash para LOLSapoBot.
 * Siguen el esquema de la API v10 de Discord (Application Command Object).
 */

export const COMANDOS = [
  {
    name: "envivo",
    description: "🔴 Activa o pausa las alertas automáticas de partidas en grupo en este canal",
  },
  {
    name: "web",
    description: "🌐 Muestra el enlace directo a la web oficial de LOLSapo",
  },
  {
    name: "destacados",
    description: "⭐ Muestra los destacados (MVP, peor KDA y balance) con selector de Top 5",
    options: [
      {
        name: "periodo",
        description: "Período a consultar",
        type: 3, // String
        required: false,
        choices: [
          { name: "📅 Hoy", value: "hoy" },
          { name: "🗓️ Esta Semana", value: "semana" },
          { name: "📆 Este Mes", value: "mes" },
        ],
      },
    ],
  },
  {
    name: "quien-juega",
    description: "🐸 Consulta manual: muestra si hay amigos jugando en este momento",
  },
];
