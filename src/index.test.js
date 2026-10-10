import { describe, it, expect } from "vitest";
import worker from "./index.js";

describe("LOLSapoBot Worker Base", () => {
  it("responde 200 informativo a peticiones GET", async () => {
    const request = new Request("https://lolsapobot.local/", { method: "GET" });
    const response = await worker.fetch(request, {}, {});

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain("LOLSapoBot activo");
  });

  it("responde a peticiones POST iniciales", async () => {
    const request = new Request("https://lolsapobot.local/", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const response = await worker.fetch(request, {}, {});

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("message");
  });
});

