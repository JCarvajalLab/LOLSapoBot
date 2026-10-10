# LOLSapoBot — Bitácora de Memoria del Proyecto

> Este documento es la memoria persistente del proyecto. El agente principal lo actualiza al completar hitos, fases o tomar decisiones clave para mantener el contexto continuo.

---

## 1. Estado Actual

| Métrica / Fase | Estado | Detalle |
|---|---|---|
| **Fase actual** | **Fase 1: Cimientos y Seguridad** (Completada) | Estructura base, Wrangler, Vitest, CI con gitleaks y 0 vulnerabilidades. Lista para PR. |
| **Última actualización** | 2026-10-10 | Finalización de Fase 1. |
| **Tests** | 🧪 2/2 pasando | Vitest ejecutado con éxito. |
| **Seguridad** | 🔒 0 vulnerabilidades | npm audit limpio, .gitignore configurado, gitleaks activo. |

---

## 2. Decisiones de Arquitectura y Razón de Ser

### D-01: Bot Serverless con Cloudflare Workers (Discord HTTP Interactions)
* **Decisión:** Usar Cloudflare Workers respondiendo a webhooks de Discord en lugar de un bot con conexión WebSocket continua (`discord.py` / `discord.js client`).
* **Por qué:** Permite mantener el bot activo 24/7 con **$0 costo** (dentro del plan gratuito de Cloudflare de 100.000 peticiones/día), sin necesidad de mantener un PC encendido ni pagar hosting/VPS.

### D-02: Consumo del JSON Estático de LOLSapo (Sin Riot API directa en el bot)
* **Decisión:** El bot lee `https://jcarvajallab.github.io/LOLSapo/datos/lol.json` en vez de consultar la API de Riot Games.
* **Por qué:** Evita duplicar el consumo de rate limit de Riot, no requiere mantener una Riot API key extra en el bot, y reutiliza la lógica ya calculada de KDA, sinergias, rachas y destacados de LOLSapo.

### D-03: Desarrollo Local Primero (`wrangler dev`)
* **Decisión:** Todas las fases de desarrollo (Fase 1 a 4) se prueban y validan en entorno local antes de hacer el despliegue a la nube en la Fase 5.
* **Por qué:** Asegura que los comandos, embeds y firmas criptográficas funcionen al 100% sin depender de despliegues remotos para depurar errores.

### D-04: Flujo de Aprobación mediante Pull Requests (PRs)
* **Decisión:** Antigravity trabaja en ramas por tipo (`feat/`, `fix/`, etc.), corre tests y gitleaks, sube la rama y abre un PR en GitHub. **Antigravity nunca mergea a `main`**.
* **Por qué:** Garantiza que Deo mantenga el control total del repositorio, reciba la notificación de GitHub, audite los cambios y sea quien ejecute el merge.

### D-05: Commits Atómicos y Granulares
* **Decisión:** Realizar commits pequeños y frecuentes por cada unidad lógica o paso técnico (código, tests, refactors) en lugar de un único commit gigante por fase.
* **Por qué:** Permite máxima trazabilidad histórica y facilita volver atrás (`git revert` / `git checkout`) ante cualquier falla imprevista sin perder el resto del trabajo.

---

## 3. Plantilla de Commits y Ramas (Estilo LOLSapo)

### Convención de Ramas
* `feat/<alcance-o-fase>`: Nuevas funcionalidades (ej: `feat/fase-1-setup`, `feat/fase-2-interacciones-base`).
* `fix/<alcance>`: Corrección de fallos.
* `docs/<alcance>`: Cambios en documentación (`REQUERIMIENTOS.md`, `MEMORIA.md`).
* `style/<alcance>`: Formato o estilo sin cambios de lógica.
* `test/<alcance>`: Tests agregados o corregidos.
* `chore/<alcance>`: Mantenimiento, dependencias, tooling.

### Formato de Commits
```
<tipo>: <descripción corta en minúsculas en español>

[cuerpo opcional explicando el por qué y viñetas de cambios]

Co-Authored-By: Antigravity <noreply@google.com>
```

*Ejemplos tomados de LOLSapo:*
* `feat: top 5 del grupo al hacer clic en una tarjeta de destacados`
* `fix: el top 5 no se reabre solo y el mes viejo se muestra cerrado`
* `docs: requerimientos iniciales y arquitectura base`
* `chore: configurar wrangler y dependencias de desarrollo`

---

## 4. Aprendizajes y Errores a Evitar

* 🚫 **Límite de 3 segundos de Discord:** Discord exige que el endpoint responda en menos de 3000 ms. Si la descarga del JSON de LOLSapo tarda, se debe responder con `DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE` (tipo 5) y luego editar la respuesta.
* 🚫 **Firma Ed25519 obligatoria:** Discord envía peticiones periódicas de validación. Si no se valida la firma con `crypto.subtle` (Web Crypto) usando la `PUBLIC_KEY`, Discord desactiva el endpoint automáticamente.
* 🔒 **Nunca commitear `.env`:** El archivo `.env` jamás debe versionarse. Solo se versiona `.env.example` con variables vacías.
* 🔒 **Gitleaks en pre-commit y CI:** Mantener gitleaks activo para detectar tokens accidentales antes de que lleguen a GitHub.

---

## 5. Próximos Pasos Inmediatos

1. 📌 **Deo:** Revisar y aprobar el Pull Request de la **Fase 1** en GitHub.
2. 📌 **Fase 2:** Crear la rama `feat/fase-2-interacciones-base` para implementar la verificación de firmas criptográficas Ed25519 de Discord y responder al PING.

