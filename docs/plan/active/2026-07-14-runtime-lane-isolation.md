---
tags:
  - plan
  - active
  - runtime
  - engineering
description: Runtime lane isolation SSOT, preflight, Playwright anti-poisoning
created: 2026-07-14T00:00:00
updated: 2026-07-14T22:50:00
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

## Verification (2026-07-14)

- [x] Core Playwright on isolated e2e lane: **45 passed** (auth/goal/reminder/user-settings/dashboard-retirement/notification/task-template)
- [x] Live healthz during run reported `lane=e2e` on host `:3000`
- [x] Preflight: e2e requires free API/Web; test PG `5433` owned by test stack
- [x] local-docker rebuild after Nx cycle fix (host maps: API `53080`, WEB `58080`, AI `58100`, PS `58081`, PG `55432`, REDIS `56379`; `up exit 0`; all containers healthy)
- [x] post-up: `runtime:preflight:local-docker` pass; e2e preflight still free of docker API on `:3000` (note: local-docker API `:53080` isolated)

## Follow-up engineering (Nx graph poison)

Root cause of `api:build` circular dependency was **scratch scripts under `packages/database`** dynamically importing `@dailyuse/task`, which created a `database → task` dynamic graph edge (product deps are only `task → database`).

Mitigations applied:

1. Remove package-root `.tmp-*` scratch scripts from library trees
2. Drop redundant explicit `"database:build"` from package `dependsOn` (keep `"^build"` only; database already flows via package deps)
3. Ignore `.tmp-*` scratch files in `.gitignore` and `nx.json` `namedInputs.default`

- Verified: `nx build api --skip-nx-cache` → SUCCESS (no circular dependency; 23 deps).

## Live verification notes (2026-07-14 ~22:48)

```
node ./tools/docker/local-compose.mjs up   # after nx cycle fix → up exit 0
node ./tools/runtime/preflight.mjs --profile local-docker  # OK
node ./tools/runtime/preflight.mjs --profile e2e           # OK (:3000 closed)
curl http://localhost:53080/healthz  → {"status":"ok"}
curl http://localhost:58080/         → 200
curl http://localhost:58100/healthz  → healthy
```

Test infra `Memoflow-test-db` on `:5433` remains up alongside local-docker (orphan-compatible; not a port conflict).
