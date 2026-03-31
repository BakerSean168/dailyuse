---
tags:
  - guide
  - development
  - logging
  - troubleshooting
description: Memoflow logging and troubleshooting tools guide for API, Desktop, and PowerSync
created: 2026-03-10T00:00:00
updated: 2026-03-10T00:00:00
---

# Logging and Tools Guide

This guide explains where logs are written, where to read them, and which tools to use first when troubleshooting.

## Quick Answer: where to read logs

- API runtime logs: terminal running `nx serve api`
- API persisted logs: `apps/api/logs/app-YYYY-MM-DD.log` and `apps/api/logs/error-YYYY-MM-DD.log`
- Desktop runtime logs: terminal running `nx serve desktop`
- Desktop persisted logs: not enabled by default (currently console-first)
- PowerSync service logs: `docker logs -f Memoflow-dev-powersync`
- Postgres service logs: `docker logs -f Memoflow-dev-db`

## Logging architecture in this repo

### API (`apps/api`)

- Uses `createLogger` from `@dailyuse/utils`
- Initializes `LoggerFactory` with `WinstonLogger` at startup
- Enables file rotation (`DailyRotateFile`) and console output
- Entry points:
  - `apps/api/src/main.ts`
  - `apps/api/src/shared/infrastructure/config/logger.config.ts`
  - `packages/utils/src/logger/WinstonLogger.ts`

### Desktop (`apps/desktop`)

- Uses `createLogger` in many modules
- Does not initialize a Winston provider in Desktop startup today
- Therefore, logs are primarily console transport output (terminal / devtools)
- Some critical PowerSync code paths still use direct `console.log/error`
- Entry points:
  - `apps/desktop/src/main/main.ts`
  - `apps/desktop/src/main/database/powersync.ts`
  - `apps/desktop/src/main/modules/authentication/application/AuthDesktopApplicationService.ts`

### PowerSync and database services (Docker)

- Service-side sync logs are not in app logger files
- Read them from containers directly
- Key commands:

```bash
docker ps
docker logs -f Memoflow-dev-powersync
docker logs -f Memoflow-dev-db
```

## Recommended troubleshooting workflow

### 1) Start services using Nx

```bash
nx serve api
nx serve desktop
```

Then keep both terminals open.

### 2) If "Desktop has no data"

- Check Desktop terminal for PowerSync connect/token/crud errors
- Check API terminal for `/powersync/token` and `/powersync/crud` failures
- Check PowerSync container logs for downstream sync activity

### 3) If "API is up but sync still fails"

- Confirm API DB connectivity at startup logs
- Confirm PowerSync container is healthy and connected to correct source DB
- Confirm Desktop token endpoint resolves to expected API base URL

## Common misunderstandings

- "No terminal error means no issue": false. Some failures happen in background tasks and may appear as warn/error later.
- "Desktop has persisted logger files like API": currently false by default.
- "PowerSync logs are in API app logs": false, service logs are in Docker container logs.

## Tool reference (what to use first)

- `nx serve api`: start API in watch mode
- `nx serve desktop`: start Desktop in dev mode
- `docker logs -f Memoflow-dev-powersync`: inspect sync service behavior
- `docker logs -f Memoflow-dev-db`: inspect Postgres container status
- `pnpm nx run api:prisma-studio`: inspect DB records visually

## Current limitations and next step

- Desktop does not yet have file-persisted logger wired like API.
- If needed, add Desktop logger bootstrap that registers a Node-capable provider for main process file logging.


