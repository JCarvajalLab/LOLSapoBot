# LOLSapoBot — Documento Base de Requerimientos y Alcance

> **Versión:** 0.3 · **Estado:** Requerimientos validados, listo para inicio de Fase 0 / 1  
> **Dueño del repositorio:** Deo (JCarvajalLab)  
> **Asistente:** Antigravity / Claude  
> **Repositorio:** `LOLSapoBot` (Público)  
> **Costo:** $0 (Cloudflare Workers Free Tier)

---

## 1. Visión

**LOLSapoBot** es un bot de Discord serverless para el grupo cerrado de amigos del servidor **LAS**. Su función es responder a comandos slash (`/`) e informar en el servidor de Discord sobre quién está en partida, el ranking interno del grupo, las sinergias de dúo y los destacados del día (MVP y peor jugador).

No consulta a Riot directamente: consume los datos generados por el proyecto **LOLSapo** (`https://jcarvajallab.github.io/LOLSapo/datos/lol.json` y `tft.json`), eliminando costos de infraestructura y evitando problemas de vencimiento de claves o límites de peticiones.

---

## 2. Definiciones Confirmadas

| # | Definición | Estado |
|---|------------|--------|
| **D1** | **Infraestructura:** Cloudflare Workers (Discord HTTP Interactions). Sin servidor 24/7 propio ni costo. | ✅ Confirmado |
| **D2** | **Costo:** $0 recurrente. Opera dentro del plan gratuito de Cloudflare (100.000 peticiones/día). | ✅ Confirmado |
| **D3** | **Desarrollo local primero:** El bot debe funcionar y probarse 100% en local (`wrangler dev`) antes de desplegarse a producción. | ✅ Confirmado |
| **D4** | **Fuente de Datos:** Lee los JSON estáticos ya publicados por LOLSapo en GitHub Pages. | ✅ Confirmado |
| **D5** | **Público:** Grupo cerrado de amigos configurados en LOLSapo. | ✅ Confirmado |
| **D6** | **Flujo de Git:** Antigravity trabaja en ramas según el tipo (`feat/`, `fix/`, `docs/`, etc.), hace push y abre el **Pull Request (PR)**. | ✅ Confirmado |
| **D7** | **Regla de Merges:** 🚫 **Antigravity NUNCA mergea a `main`**. Deo recibe la notificación del PR, lo revisa y realiza el merge desde GitHub. | ✅ Confirmado |
| **D8** | **Seguridad Estricta:** Verificación criptográfica obligatoria de firmas Ed25519 de Discord, gitleaks, secrets aislados en Cloudflare/GitHub. | ✅ Confirmado |
| **D9** | **Agentes Especializados:** Subagentes para auditoría de seguridad y desarrollo del Worker. | ✅ Confirmado |
| **D10** | **Archivo de Memoria:** Se mantiene `MEMORIA.md` actualizado en cada sesión con estado, decisiones, errores a evitar y próximos pasos. | ✅ Confirmado |

---

## 3. Arquitectura Técnica

```
[ Discord Client ] 
       │ (/quien-juega)
       ▼
[ Discord Gateway / API ] 
       │ HTTP POST (firmado con Ed25519)
       ▼
[ Cloudflare Worker (Local con wrangler dev o Producción) ] 
       │ 1. Valida criptográficamente la firma Ed25519
       │ 2. Descarga https://jcarvajallab.github.io/LOLSapo/datos/lol.json
       ▼
[ Respuesta HTTP con Embeds en < 3s a Discord ]
```

---

## 4. Fases de Desarrollo

### Fase 0: Preparación Externa y Cuentas (Deo)
- Crear la aplicación en [Discord Developer Portal](https://discord.com/developers/applications) (`APPLICATION_ID`, `PUBLIC_KEY`, `BOT_TOKEN`).
- Invitar al bot al servidor de Discord con permisos de comandos y embeds.
- Crear el repositorio público `LOLSapoBot` en GitHub.

### Fase 1: Cimientos, Herramientas y Seguridad Base
- Rama: `feat/fase-1-setup`
- Estructura del proyecto en JavaScript (Node.js LTS, ESM).
- Configuración de Cloudflare Worker (`wrangler.jsonc`).
- Seguridad base: `.gitignore`, `.env.example`, `.gitleaks.toml`.
- Workflow de GitHub Actions (`ci.yml`) con permisos mínimos y dependencias auditadas.
- Agente de seguridad configurado.
- *Hito:* Tests y gitleaks pasando -> PR abierto por Antigravity -> Merge por Deo.

### Fase 2: Endpoint Local y Verificación Ed25519
- Rama: `feat/fase-2-interacciones-base`
- Servidor local del Worker con `wrangler dev`.
- Verificación estricta de firmas `X-Signature-Ed25519` y `X-Signature-Timestamp` usando Web Crypto API.
- Respuesta obligatoria a `InteractionType.PING` con `PONG`.
- Pruebas locales de validación de firmas.
- Conexión de prueba con Discord Developer Portal (Interactions Endpoint URL).
- *Hito:* Discord valida el endpoint con éxito -> PR abierto -> Merge por Deo.

### Fase 3: Registro de Comandos Slash y Cliente de Datos
- Rama: `feat/fase-3-comandos-registro`
- Script para registrar los comandos slash (`/quien-juega`, `/ranking`, `/destacados`) en la API de Discord vía script local seguro.
- Módulo consumidor seguro del JSON de LOLSapo con validación de tipos y tolerancia a fallos.
- *Hito:* Comandos visibles en Discord y datos leídos en local -> PR abierto -> Merge por Deo.

### Fase 4: Implementación de Comandos de LoL (Embeds)
- Rama: `feat/fase-4-comandos-lol`
- `/quien-juega`: Embed interactivo con quién está jugando, campeón y tiempo.
- `/ranking`: Tabla de clasificación del grupo (puntos, winrate).
- `/destacados`: Resumen del MVP, peor jugador y balance del día.
- Manejo de estados vacíos y respuestas amigables.
- Pruebas completas en entorno local.
- *Hito:* Todos los comandos LoL funcionando en local -> PR abierto -> Merge por Deo.

### Fase 5: Despliegue Automatizado a Cloudflare (Producción 24/7)
- Rama: `feat/fase-5-deploy-produccion`
- Configuración de GitHub Actions `deploy.yml` para desplegar el Worker a Cloudflare Workers automáticamente al mergear a `main`.
- Inyección de secrets de producción en Cloudflare (`DISCORD_PUBLIC_KEY`, `DISCORD_TOKEN`).
- Actualización de la URL del endpoint en Discord Developer Portal a la URL de producción.
- *Hito:* Bot 100% operativo 24/7 en Discord sin servidores locales encendidos -> PR abierto -> Merge por Deo.

### Fase 6: TFT y Sinergias (Comandos Avanzados)
- Rama: `feat/fase-6-tft-sinergia`
- Consumo de `tft.json`.
- Comandos `/sinergia [amigo]` y `/tft`.
- *Hito:* Funcionalidades avanzadas completadas -> PR abierto -> Merge por Deo.

---

## 5. Reglas de Seguridad

1. 🚫 **Cero Secretos:** Ni `BOT_TOKEN`, ni `PUBLIC_KEY` privada, ni tokens de Cloudflare pueden subirse a git.
2. 🔒 **Firma Criptográfica:** Ninguna petición HTTP se procesa si falla la firma Ed25519; responde 401 Unauthorized inmediatamente.
3. 🔒 **Acciones Fijadas:** Los GitHub Actions deben usar el commit SHA inmutable en lugar de tags mutables.
4. 🔒 **Permisos Mínimos:** Los workflows de CI/CD usan `permissions: {}` o el mínimo necesario.

