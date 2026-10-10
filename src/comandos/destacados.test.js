import { describe, it, expect, vi, beforeEach } from "vitest";
import { manejarComandoDestacados, manejarSeleccionTop5 } from "./destacados.js";

describe("Comando /destacados y Selector de Top 5", () => {
  const mockDatos = {
    amigos: [
      { nombre: "Johnadis", slug: "johnadis-las" },
      { nombre: "Nicø", slug: "nic-las" },
    ],
    destacados: {
      mejor_jugador_hoy: { amigo: "Johnadis", kda: 10, campeon: "Viktor", asesinatos: 10, muertes: 1, asistencias: 0, danio: 25000 },
      peor_jugador_hoy: { amigo: "Nicø", kda: 0.8, campeon: "Yasuo", asesinatos: 1, muertes: 5, asistencias: 3, danio: 8000 },
      balance_hoy: { victorias: 4, derrotas: 2, porcentaje: 66.7 },
      tops: {
        mejor_jugador_semana: [
          { amigos: ["johnadis-las"], kda: 12, campeon: "Viktor", asesinatos: 10, muertes: 1, asistencias: 2, danio: 30000, resultado: "victoria" },
        ],
      },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDatos,
    });
  });

  it("genera destacados de hoy con menú desplegable para Top 5", async () => {
    const res = await manejarComandoDestacados("hoy");
    expect(res.embeds[0].title).toContain("Destacados de Hoy");
    expect(res.components[0].components[0].type).toBe(3); // StringSelect
  });

  it("genera destacados de la semana con opciones adicionales", async () => {
    const res = await manejarComandoDestacados("semana");
    expect(res.embeds[0].title).toContain("Destacados de la Semana");
    expect(res.components[0].components[0].options).toHaveLength(4);
  });

  it("muestra el Top 5 formateado al seleccionar una categoría", async () => {
    const res = await manejarSeleccionTop5("mejor_jugador_semana");
    expect(res.embeds[0].title).toContain("Top 5 — Mejor Jugador de la Semana");
    expect(res.embeds[0].description).toContain("Johnadis");
    expect(res.embeds[0].description).toContain("Viktor");
  });
});
