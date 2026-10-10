import { describe, it, expect } from "vitest";
import { validarFirmaDiscord } from "./seguridad.js";
import crypto from "node:crypto";

describe("Seguridad — Validación de Firmas Ed25519 de Discord", () => {
  it("rechaza si falta la firma", async () => {
    const valida = await validarFirmaDiscord("{}", null, "1234567890", "a".repeat(64));
    expect(valida).toBe(false);
  });

  it("rechaza si falta el timestamp", async () => {
    const valida = await validarFirmaDiscord("{}", "b".repeat(128), null, "a".repeat(64));
    expect(valida).toBe(false);
  });

  it("rechaza si falta la clave pública", async () => {
    const valida = await validarFirmaDiscord("{}", "b".repeat(128), "1234567890", undefined);
    expect(valida).toBe(false);
  });

  it("rechaza si la firma es apócrifa o inválida", async () => {
    const valida = await validarFirmaDiscord(
      JSON.stringify({ type: 1 }),
      "deadbeef".repeat(16),
      "1234567890",
      "0123456789abcdef".repeat(4)
    );
    expect(valida).toBe(false);
  });

  it("valida correctamente una firma Ed25519 legítima", async () => {
    // Generamos un par de claves Ed25519 real para la prueba
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

    // Extraer la clave pública en formato raw hex (32 bytes = 64 hex chars)
    const rawPublicKey = publicKey.export({ type: "spki", format: "der" });
    // En Ed25519 SPKI DER, los últimos 32 bytes son la clave pública cruda
    const pubKeyHex = rawPublicKey.subarray(rawPublicKey.length - 32).toString("hex");

    const rawBody = JSON.stringify({ type: 1 });
    const timestamp = "1728500000";
    const dataToSign = Buffer.concat([Buffer.from(timestamp, "utf-8"), Buffer.from(rawBody, "utf-8")]);

    // Firmar con la clave privada
    const signature = crypto.sign(null, dataToSign, privateKey).toString("hex");

    const valida = await validarFirmaDiscord(rawBody, signature, timestamp, pubKeyHex);
    expect(valida).toBe(true);
  });
});
