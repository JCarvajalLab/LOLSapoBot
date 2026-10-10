import { describe, it, expect } from "vitest";
import { manejarComandoWeb, URL_LOLSAPO_WEB } from "./web.js";

describe("Comando /web", () => {
  it("retorna un embed con la URL oficial y botón de enlace", () => {
    const respuesta = manejarComandoWeb();

    expect(respuesta.embeds).toHaveLength(1);
    expect(respuesta.embeds[0].title).toContain("LOLSapo");
    expect(respuesta.components).toHaveLength(1);

    const boton = respuesta.components[0].components[0];
    expect(boton.type).toBe(2);
    expect(boton.style).toBe(5);
    expect(boton.url).toBe(URL_LOLSAPO_WEB);
  });
});
