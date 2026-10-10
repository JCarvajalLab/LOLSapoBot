import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  obtenerDatosLol,
  obtenerEnPartida,
  obtenerRanking,
  obtenerDestacados,
  ErrorDatosLOLSapo,
} from "./datos.js";

describe("Cliente de Datos LOLSapo (src/datos.js)", () => {
  const mockDatos = {
    actualizado: "2026-10-10T17:00:00Z",
    amigos: [
      {
        nombre: "Johnadis",
        riot_id: "Johnadis#LAS",
        slug: "johnadis-las",
        perfil: { nivel: 1067 },
        rangos: {
          solo: { tier: "PLATINUM", division: "II", lp: 85 },
          flex: { tier: "EMERALD", division: "III", lp: 69 },
        },
        estadisticas: {
          total: { victorias: 31, derrotas: 37, partidas: 69, winrate: 45.6 },
        },
        jugando: {
          campeon: "Viktor",
          modo: "Normal (Reclutamiento)",
          tiempo: 1200,
          es_grupo: true,
        },
      },
      {
        nombre: "Nicø",
        riot_id: "Nicø#LAS",
        slug: "nic-las",
        perfil: { nivel: 500 },
        rangos: { solo: null, flex: null },
        estadisticas: {
          total: { victorias: 10, derrotas: 10, partidas: 20, winrate: 50.0 },
        },
        jugando: null,
      },
    ],
    ranking: [
      { posicion: 1, riot_id: "Johnadis#LAS" },
      { posicion: 2, riot_id: "Nicø#LAS" },
    ],
    destacados: {
      mejor_jugador_hoy: { amigo: "Johnadis", kda: 8.5, campeon: "Viktor" },
      peor_jugador_hoy: { amigo: "Nicø", kda: 0.5, campeon: "Yasuo" },
      balance_hoy: { victorias: 3, derrotas: 1 },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("obtenerDatosLol", () => {
    it("descarga y valida los datos correctamente", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockDatos,
      });

      const datos = await obtenerDatosLol("https://test.local/lol.json", 1000);
      expect(datos.amigos).toHaveLength(2);
      expect(datos.actualizado).toBe("2026-10-10T17:00:00Z");
    });

    it("lanza ErrorDatosLOLSapo si el servidor devuelve error HTTP", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(obtenerDatosLol("https://test.local/lol.json", 1000)).rejects.toThrow(
        ErrorDatosLOLSapo
      );
    });

    it("lanza ErrorDatosLOLSapo si el formato JSON no contiene el array de amigos", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ datos_corruptos: true }),
      });

      await expect(obtenerDatosLol("https://test.local/lol.json", 1000)).rejects.toThrow(
        "El formato del archivo JSON de LOLSapo es inválido"
      );
    });

    it("maneja timeouts cancelando con AbortController", async () => {
      globalThis.fetch = vi.fn().mockImplementation((_url, { signal }) => {
        return new Promise((_, reject) => {
          signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        });
      });

      await expect(obtenerDatosLol("https://test.local/lol.json", 10)).rejects.toThrow(
        "Tiempo de espera agotado"
      );
    });
  });

  describe("obtenerEnPartida", () => {
    it("filtra únicamente los amigos que están jugando actualmente", () => {
      const enPartida = obtenerEnPartida(mockDatos);
      expect(enPartida).toHaveLength(1);
      expect(enPartida[0].nombre).toBe("Johnadis");
      expect(enPartida[0].campeon).toBe("Viktor");
      expect(enPartida[0].tiempoMinutos).toBe(20);
      expect(enPartida[0].esGrupo).toBe(true);
    });

    it("retorna lista vacía si nadie está jugando", () => {
      const enPartida = obtenerEnPartida({
        amigos: [{ nombre: "Nadie", jugando: null }],
      });
      expect(enPartida).toHaveLength(0);
    });
  });

  describe("obtenerRanking", () => {
    it("extrae la clasificación con rangos y porcentajes formateados", () => {
      const ranking = obtenerRanking(mockDatos);
      expect(ranking).toHaveLength(2);
      expect(ranking[0].posicion).toBe(1);
      expect(ranking[0].nombre).toBe("Johnadis");
      expect(ranking[0].rangoSolo).toBe("PLATINUM II (85 LP)");
      expect(ranking[0].rangoFlex).toBe("EMERALD III (69 LP)");
      expect(ranking[0].winrate).toBe("45.6%");

      expect(ranking[1].nombre).toBe("Nicø");
      expect(ranking[1].rangoSolo).toBe("Unranked");
    });
  });

  describe("obtenerDestacados", () => {
    it("extrae los destacados del día correctamente", () => {
      const destacados = obtenerDestacados(mockDatos);
      expect(destacados.mejorJugadorHoy).toEqual({
        amigo: "Johnadis",
        kda: 8.5,
        campeon: "Viktor",
      });
      expect(destacados.peorJugadorHoy).toEqual({
        amigo: "Nicø",
        kda: 0.5,
        campeon: "Yasuo",
      });
      expect(destacados.balanceHoy).toEqual({ victorias: 3, derrotas: 1 });
    });
  });
});
