# LeadUp Inngest Pilot

Piloto de migracion del waterfall Apollo -> Lusha -> Apify desde N8N a Inngest. 2 semanas en paralelo, mismas keys, mismo formato de salida. Comparar latencia, fiabilidad y trazabilidad.

## Por que Inngest

| Ventaja | N8N actual | Inngest |
|---------|-----------|---------|
| Code-first (TS) | NO (JSON visual) | SI |
| Reintentos automaticos por step | manual | SI |
| Step-level durability | NO | SI |
| Concurrencia + rate limit | fragil | SI |
| Replay / time-travel debug | NO | SI |
| Trazas en Langfuse | NO | SI via OTel |

## Quickstart

```bash
cd /Users/nicolasag/ClienderOSV1/apps/leadup/inngest-pilot
npm install
npm run dev
```

Inngest Dev Server abre dashboard en http://localhost:8288 .
Fastify handler en http://localhost:3100/api/inngest .

## Disparar un test

```bash
curl -X POST http://localhost:8288/e/test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "leadup/lead.enrich.requested",
    "data": { "companyName": "Acme Corp", "domain": "acme.com" }
  }'
```

Ver ejecucion paso-a-paso en el dashboard.

## Estructura

```
inngest-pilot/
package.json
tsconfig.json
README.md
src/
  inngest.ts                  # Cliente Inngest
  server.ts                   # Fastify + handler /api/inngest
  functions/
    enrichWaterfall.ts        # Funcion Lusha->Apify
```

## Variables de entorno

Reusa /Users/nicolasag/.env: LUSHA_API_KEY, APIFY_TOKEN.

## Proximos pasos post-piloto

1. Persistencia: llamar http://leadup:8002/api/companies para escribir en lu_companies/lu_contacts.
2. OTel + Langfuse: wrap step.run con OpenTelemetry, trazas a http://127.0.0.1:3030.
3. Produccion: desplegar como servicio Docker dentro del compose Cliender.
4. Decision final: medir vs N8N en latencia p95, % exito, coste mantenimiento.

## Metricas piloto (14 dias)

- Latencia p50/p95 por step
- % exito vs N8N (mismo input, mismo dia)
- Coste tokens API
- MTTR cuando falla
- DX score subjetiva
