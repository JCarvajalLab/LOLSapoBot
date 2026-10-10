import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "./index.js";
import crypto from "node:crypto";

describe("LOLSapoBot Worker Endpoint", () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const rawPublicKey = publicKey.export({ type: "spki", format: "der" });
  const pubKeyHex = rawPublicKey.subarray(rawPublicKey.length - 32).toString("hex");

  function firmarPeticion(body, timestamp) {
    const dataToSign = Buffer.concat([
      Buffer.from(timestamp, "utf-8"),
      Buffer.from(body, "utf-8"),
    ]);
    return crypto.sign(null, dataToSign, privateKey).toString("hex");
  }

  const mockDatos = {
    actualizado: "2026-10-10T17:00:00Z",
    amigos: [
      {
        nombre: "Johnadis",
        riot_id: "Johnadis#LAS",
        perfil: { nivel: 100 },
        rangos: { solo: { tier: "GOLD", division: "I", lp: 50 }, flex: null },
        estadisticas: { total: { victorias: 10, derrotas: 5, partidas: 15, winrate: 66.7 } },
        jugando: null,
      },
    ],
    ranking: [{ posicion: 1, riot_id: "Johnadis#LAS" }],
    destacados: {
      mejor_jugador_hoy: { amigo: "Johnadis", kda: 5.0, campeon: "Ahri" },
      peor_jugador_hoy: null,
      balance_hoy: { victorias: 2, derrotas: 0 },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("responde 200 informativo a peticiones GET", async () => {
    const request = new Request("https://lolsapobot.local/", { method: "GET" });
    const response = await worker.fetch(request, {}, {});

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("LOLSapoBot activo");
  });

  it("rechaza 401 a peticiones POST sin firma válida", async () => {
    const request = new Request("https://lolsapobot.local/", {
      method: "POST",
      body: JSON.stringify({ type: 1 }),
      headers: { "Content-Type": "application/json" },
    });
    const response = await worker.fetch(request, { DISCORD_PUBLIC_KEY: pubKeyHex }, {});

    expect(response.status).toBe(401);
  });

  it("responde 200 PONG a peticiones PING de Discord firmadas legítimamente", async () => {
    const body = JSON.stringify({ type: 1 });
    const timestamp = "1728500000";
    const signature = firmarPeticion(body, timestamp);

    const request = new Request("https://lolsapobot.local/", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-signature-ed25519": signature,
        "x-signature-timestamp": timestamp,
      },
    });

    const response = await worker.fetch(request, { DISCORD_PUBLIC_KEY: pubKeyHex }, {});

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ type: 1 });
  });

  it("rechaza 400 a peticiones firmadas con JSON corrupto", async () => {
    const body = "{ invalid json ";
    const timestamp = "1728500000";
    const signature = firmarPeticion(body, timestamp);

    const request = new Request("https://lolsapobot.local/", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-signature-ed25519": signature,
        "x-signature-timestamp": timestamp,
      },
    });

    const response = await worker.fetch(request, { DISCORD_PUBLIC_KEY: pubKeyHex }, {});

    expect(response.status).toBe(400);
  });

  it("ejecuta el comando slash /ranking y retorna un Embed formateado", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDatos,
    });

    const body = JSON.stringify({
      type: 2,
      data: { name: "ranking" },
    });
    const timestamp = "1728500000";
    const signature = firmarPeticion(body, timestamp);

    const request = new Request("https://lolsapobot.local/", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-signature-ed25519": signature,
        "x-signature-timestamp": timestamp,
      },
    });

    const response = await worker.fetch(request, { DISCORD_PUBLIC_KEY: pubKeyHex }, {});
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.type).toBe(4);
    expect(json.data.embeds).toHaveLength(1);
    expect(json.data.embeds[0].title).toContain("Tabla de Clasificación");
  });

  it("ejecuta el comando slash /destacados y retorna un Embed", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDatos,
    });

    const body = JSON.stringify({
      type: 2,
      data: { name: "destacados" },
    });
    const timestamp = "1728500000";
    const signature = firmarPeticion(body, timestamp);

    const request = new Request("https://lolsapobot.local/", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-signature-ed25519": signature,
        "x-signature-timestamp": timestamp,
      },
    });

    const response = await worker.fetch(request, { DISCORD_PUBLIC_KEY: pubKeyHex }, {});
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.type).toBe(4);
    expect(json.data.embeds[0].title).toContain("Destacados de la Jornada");
  });
});
