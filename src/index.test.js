import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "./index.js";
import crypto from "node:crypto";

describe("LOLSapoBot Worker Endpoint Completo", () => {
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
        slug: "johnadis-las",
        perfil: { nivel: 100 },
        rangos: { solo: { tier: "GOLD", division: "I", lp: 50 }, flex: null },
        estadisticas: { total: { victorias: 10, derrotas: 5, partidas: 15, winrate: 66.7 } },
        jugando: null,
      },
    ],
    destacados: {
      mejor_jugador_hoy: { amigo: "Johnadis", kda: 5.0, campeon: "Ahri" },
      balance_hoy: { victorias: 2, derrotas: 0 },
      tops: {
        mejor_jugador_hoy: [
          { amigos: ["johnadis-las"], kda: 5.0, campeon: "Ahri", resultado: "victoria" },
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

  it("responde 200 informativo a peticiones GET", async () => {
    const request = new Request("https://lolsapobot.local/", { method: "GET" });
    const response = await worker.fetch(request, {}, {});
    expect(response.status).toBe(200);
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

  it("responde 200 PONG a peticiones PING de Discord", async () => {
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

  it("despacha comando /web y responde con embed y botón", async () => {
    const body = JSON.stringify({
      type: 2,
      data: { name: "web" },
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
    expect(json.data.embeds[0].title).toContain("LOLSapo — Web Oficial");
    expect(json.data.components[0].components[0].url).toContain("github.io/LOLSapo");
  });

  it("despacha comando /envivo y alterna el estado del canal", async () => {
    const body = JSON.stringify({
      type: 2,
      data: { name: "envivo" },
      channel_id: "canal_test_123",
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
    expect(json.data.content).toContain("ACTIVADAS");
  });

  it("despacha comando /destacados y responde con embed y selector", async () => {
    const body = JSON.stringify({
      type: 2,
      data: { name: "destacados", options: [{ name: "periodo", value: "hoy" }] },
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
    expect(json.data.embeds[0].title).toContain("Destacados de Hoy");
    expect(json.data.components).toBeDefined();
  });

  it("maneja selección de Top 5 en el menú desplegable actualizando el mensaje (Tipo 7)", async () => {
    const body = JSON.stringify({
      type: 3, // MESSAGE_COMPONENT
      data: {
        custom_id: "select_top5_hoy",
        values: ["mejor_jugador_hoy"],
      },
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
    expect(json.type).toBe(7); // UPDATE_MESSAGE
    expect(json.data.embeds[0].title).toContain("Top 5 — Mejor Jugador de Hoy");
  });
});
