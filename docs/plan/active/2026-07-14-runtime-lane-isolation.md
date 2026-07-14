---
tags:
  - plan
  - active
  - runtime
  - engineering
description: Runtime lane isolation SSOT, preflight, Playwright anti-poisoning
created: 2026-07-14T00:00:00
updated: 2026-07-14T00:00:00
---

# Runtime lane isolation (2026-07-14)

## Goal

Eliminate host port / env-lane confusion between `host-dev`, Playwright `e2e`, and `local-docker` by making profiles explicit, isolated, and fail-fast.

## Scope

1. SSOT: `tools/runtime/profiles.json` + `load-profiles.mjs`
2. `pnpm runtime:preflight*`
3. `docker:local` forces isolated host ports
4. Playwright API does not silently reuse Docker `:3000`
5. `/healthz` may report `RUNTIME_LANE`
6. Docs: `runtime-lanes.md`, update `local.docker.md`

## Non-goals

- Changing production Caddy / cloud ports
- Migrating e2e API to a dedicated 13xxx port (optional later)
- Committing secrets or rewriting all historical docs

## Done when

- [x] profiles SSOT exists
- [x] local-compose applies isolated host ports
- [x] preflight CLI works
- [x] Playwright API reuse is opt-in only
- [x] start-api-server fails loudly on wrong owner
- [x] developer docs updated
