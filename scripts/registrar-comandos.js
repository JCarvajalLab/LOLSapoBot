#!/usr/bin/env node
/**
 * Script CLI para registrar los comandos Slash en la API de Discord (v10).
 *
 * Uso:
 *   node scripts/registrar-comandos.js
 *
 * Lee las credenciales de variables de entorno o del archivo local `.dev.vars`:
 *   - DISCORD_APPLICATION_ID
 *   - DISCORD_TOKEN
 *   - DISCORD_GUILD_ID (opcional: para registro instantáneo en un servidor específico)
 */

import fs from "node:fs";
import path from "node:path";
import { COMANDOS } from "../src/comandos/definiciones.js";

function cargarVariablesLocales() {
  const rutaDevVars = path.resolve(process.cwd(), ".dev.vars");
  if (!fs.existsSync(rutaDevVars)) {
    return;
  }

  const contenido = fs.readFileSync(rutaDevVars, "utf-8");
  for (const linea of contenido.split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const [clave, ...resto] = limpia.split("=");
    if (clave && resto.length > 0) {
      const valor = resto.join("=").trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[clave.trim()]) {
        process.env[clave.trim()] = valor;
      }
    }
  }
}

async function registrar() {
  cargarVariablesLocales();

  const appId = process.env.DISCORD_APPLICATION_ID;
  const token = process.env.DISCORD_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!appId || !token) {
    console.error("🚫 Error: Faltan variables DISCORD_APPLICATION_ID o DISCORD_TOKEN.");
    console.error("💡 Configúralas en tus variables de entorno o en el archivo .dev.vars");
    process.exit(1);
  }

  // Si se provee GUILD_ID, se registran solo para ese servidor (inmediato, sin caché de 1h)
  const endpoint = guildId
    ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${appId}/commands`;

  const ambito = guildId ? `servidor ${guildId}` : "alcance global";
  console.log(`📡 Registrando ${COMANDOS.length} comandos slash en Discord (${ambito})...`);

  try {
    const respuesta = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(COMANDOS),
    });

    if (!respuesta.ok) {
      const errorDetalle = await respuesta.text();
      console.error(`🚫 Error al registrar comandos (HTTP ${respuesta.status}):`, errorDetalle);
      process.exit(1);
    }

    const resultado = await respuesta.json();
    console.log(`✅ ¡Comandos registrados exitosamente en Discord! (${resultado.length} comandos activos):`);
    for (const cmd of resultado) {
      console.log(`   - /${cmd.name}: ${cmd.description}`);
    }
  } catch (error) {
    console.error("🚫 Error de conexión con Discord API:", error.message);
    process.exit(1);
  }
}

registrar();
