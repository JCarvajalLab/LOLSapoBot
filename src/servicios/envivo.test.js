import { describe, it, expect } from "vitest";
import {
  toggleCanalEnVivo,
  crearEmbedPartidaEnGrupo,
  crearEmbedPartidaFinalizada,
} from "./envivo.js";

describe("Servicio En Vivo (/envivo)", () => {
  it("hace toggle de activación y pausa para un canal", async () => {
    const canalId = "canal_pruebas_123";

    // Primera ejecución: activa
    const res1 = await toggleCanalEnVivo(canalId);
    expect(res1.activo).toBe(true);
    expect(res1.mensaje).toContain("ACTIVADAS");

    // Segunda ejecución: pausa
    const res2 = await toggleCanalEnVivo(canalId);
    expect(res2.activo).toBe(false);
    expect(res2.mensaje).toContain("PAUSADAS");
  });

  it("crea el embed de partida en grupo con la lista de amigos", () => {
    const embed = crearEmbedPartidaEnGrupo({
      modo: "Normal (Reclutamiento)",
      tiempo: 900,
      amigos: [
        { nombre: "Johnadis", campeon: "Viktor" },
        { nombre: "Nicø", campeon: "Yasuo" },
      ],
    });

    expect(embed.title).toContain("¡Los Sapos entraron a partida en equipo!");
    expect(embed.fields[0].value).toContain("Johnadis");
    expect(embed.fields[0].value).toContain("Nicø");
  });

  it("crea el embed de partida finalizada con color verde si es victoria", () => {
    const embed = crearEmbedPartidaFinalizada({
      resultado: "victoria",
      modo: "Ranked Flex",
      duracion: 1800,
      amigos: [{ nombre: "Johnadis", campeon: "Viktor", asesinatos: 5, muertes: 1, asistencias: 10, danio: 22000 }],
    });

    expect(embed.title).toContain("¡Victoria en Equipo!");
    expect(embed.color).toBe(0x2ecc71);
  });

  it("crea el embed de partida finalizada con color rojo si es derrota", () => {
    const embed = crearEmbedPartidaFinalizada({
      resultado: "derrota",
      modo: "Ranked SoloQ",
      duracion: 1200,
      amigos: [{ nombre: "Nicø", campeon: "Yasuo", asesinatos: 1, muertes: 10, asistencias: 2, danio: 9000 }],
    });

    expect(embed.title).toContain("Derrota en Equipo");
    expect(embed.color).toBe(0xe74c3c);
  });
});
