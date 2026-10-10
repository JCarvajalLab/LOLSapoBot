/**
 * Cliente de datos seguro para consumir el JSON estático de LOLSapo.
 * URL oficial: https://jcarvajallab.github.io/LOLSapo/datos/lol.json
 */

export const URL_LOL_DEFECTO = "https://jcarvajallab.github.io/LOLSapo/datos/lol.json";
export const TIMEOUT_DEFECTO_MS = 2500; // 2.5s para no superar el límite de 3s de Discord

export class ErrorDatosLOLSapo extends Error {
  constructor(mensaje, causa) {
    super(mensaje);
    this.name = "ErrorDatosLOLSapo";
    this.causa = causa;
  }
}

/**
 * Descarga y valida el JSON de datos de League of Legends de LOLSapo.
 *
 * @param {string} [url] URL del archivo JSON
 * @param {number} [timeoutMs] Tiempo máximo de espera en ms
 * @returns {Promise<object>} Datos completos validados
 */
export async function obtenerDatosLol(url = URL_LOL_DEFECTO, timeoutMs = TIMEOUT_DEFECTO_MS) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  try {
    const respuesta = await fetch(url, {
      signal: controlador.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "LOLSapoBot/1.0",
      },
    });

    if (!respuesta.ok) {
      throw new ErrorDatosLOLSapo(`GitHub Pages devolvió HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    if (!datos || typeof datos !== "object" || !Array.isArray(datos.amigos)) {
      throw new ErrorDatosLOLSapo("El formato del archivo JSON de LOLSapo es inválido");
    }

    return datos;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ErrorDatosLOLSapo(`Tiempo de espera agotado (${timeoutMs} ms) al consultar LOLSapo`, error);
    }
    if (error instanceof ErrorDatosLOLSapo) {
      throw error;
    }
    throw new ErrorDatosLOLSapo(`Error de conexión con LOLSapo: ${error.message}`, error);
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Extrae la lista de amigos que están en partida en este momento.
 *
 * @param {object} datos Datos de lol.json
 * @returns {Array<object>} Lista de jugadores en vivo
 */
export function obtenerEnPartida(datos) {
  const amigos = datos?.amigos ?? [];
  const enPartida = [];

  for (const amigo of amigos) {
    if (amigo?.jugando) {
      enPartida.push({
        nombre: amigo.nombre,
        riotId: amigo.riot_id,
        campeon: amigo.jugando.campeon ?? "Desconocido",
        modo: amigo.jugando.modo ?? "Partida en curso",
        tiempoMinutos: Math.floor((amigo.jugando.tiempo ?? 0) / 60),
        esGrupo: Boolean(amigo.jugando.es_grupo),
      });
    }
  }

  return enPartida;
}

/**
 * Extrae la clasificación del grupo combinando datos de ranking y perfil.
 *
 * @param {object} datos Datos de lol.json
 * @returns {Array<object>} Ranking procesado y ordenado
 */
export function obtenerRanking(datos) {
  const amigos = datos?.amigos ?? [];
  const rankingRaw = datos?.ranking ?? [];

  // Mapear amigos por Riot ID o slug para búsqueda rápida
  const mapaAmigos = new Map();
  for (const amigo of amigos) {
    mapaAmigos.set(amigo.riot_id, amigo);
    if (amigo.slug) mapaAmigos.set(amigo.slug, amigo);
  }

  const resultado = [];

  for (let i = 0; i < rankingRaw.length; i++) {
    const item = rankingRaw[i];
    const amigo = mapaAmigos.get(item.riot_id) || mapaAmigos.get(item.slug);

    const solo = amigo?.rangos?.solo;
    const flex = amigo?.rangos?.flex;
    const statsTotal = amigo?.estadisticas?.total;

    resultado.push({
      posicion: item.posicion ?? i + 1,
      nombre: amigo?.nombre ?? item.riot_id,
      riotId: item.riot_id,
      nivel: amigo?.perfil?.nivel ?? 0,
      rangoSolo: solo ? `${solo.tier} ${solo.division} (${solo.lp} LP)` : "Unranked",
      rangoFlex: flex ? `${flex.tier} ${flex.division} (${flex.lp} LP)` : "Unranked",
      winrate: statsTotal?.winrate != null ? `${statsTotal.winrate}%` : "Sin datos",
      partidas: statsTotal?.partidas ?? 0,
      victorias: statsTotal?.victorias ?? 0,
      derrotas: statsTotal?.derrotas ?? 0,
    });
  }

  return resultado;
}

/**
 * Extrae los datos destacados del día (MVP, peor jugador y balance del grupo).
 *
 * @param {object} datos Datos de lol.json
 * @returns {object} Destacados formateados
 */
export function obtenerDestacados(datos) {
  const destacados = datos?.destacados ?? {};

  return {
    actualizado: datos?.actualizado ?? null,
    mejorJugadorHoy: destacados.mejor_jugador_hoy ?? null,
    peorJugadorHoy: destacados.peor_jugador_hoy ?? null,
    balanceHoy: destacados.balance_hoy ?? null,
    rachaVictorias: destacados.racha_victorias_grupo ?? null,
    rachaDerrotas: destacados.racha_derrotas_grupo ?? null,
  };
}
