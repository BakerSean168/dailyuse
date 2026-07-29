# ai-service

`ai-service` is the Python execution service used by the `memoflow` monorepo for
LLM-facing work. TypeScript remains the public business boundary, while this
project focuses on model execution.

## Current stack

- FastAPI for HTTP routing
- Pydantic for request/response schemas and settings
- httpx for outbound provider calls
- Ruff for linting and formatting
- Pyright for type checking
- pytest for tests
- uv for Python dependency management
- Nx for monorepo task orchestration

## Directory layout

```text
apps/ai-service/
  pyproject.toml
  project.json
  src/ai_service/
    app.py
    main.py
    errors.py
    api/
    config/
    infrastructure/
    middleware/
    providers/
    schemas/
    services/
  tests/
```

## Local development

`ai-service` reads the same workspace-root env stack as the rest of the
monorepo:

- `.env`
- `.env.{NODE_ENV}`
- `.env.local`
- `.env.{NODE_ENV}.local`

Minimal local development values live in the root
[`/.env.example`](/D:/home/projects/memoflow/.env.example) and
[`/.env.development`](/D:/home/projects/memoflow/.env.development). The service
does not read `apps/ai-service/.env`.

Once the root env is configured, run:

```bash
pnpm nx run ai-service:serve
```

## Useful commands

```bash
pnpm nx run ai-service:test
pnpm nx run ai-service:eval
pnpm nx run ai-service:eval-live
pnpm nx run ai-service:lint
pnpm nx run ai-service:typecheck
pnpm nx run ai-service:format
```

`pnpm nx run ai-service:eval` runs deterministic regression cases from
[`apps/ai-service/evals/regression_cases.json`](/D:/home/projects/memoflow/apps/ai-service/evals/regression_cases.json)
using the quality gate defined in
[`apps/ai-service/evals/policy.json`](/D:/home/projects/memoflow/apps/ai-service/evals/policy.json),
compares against
[`apps/ai-service/evals/baseline_report.json`](/D:/home/projects/memoflow/apps/ai-service/evals/baseline_report.json),
and writes reports to `reports/apps/ai-service/evals/latest.json` plus a timestamped
history entry under `reports/apps/ai-service/evals/history/`.

`pnpm nx run ai-service:eval-live` runs a smaller live-provider suite from
[`apps/ai-service/evals/live_cases.json`](/D:/home/projects/memoflow/apps/ai-service/evals/live_cases.json)
with the looser gate in
[`apps/ai-service/evals/live_policy.json`](/D:/home/projects/memoflow/apps/ai-service/evals/live_policy.json).
It writes reports to `reports/apps/ai-service/evals/live-latest.json` and
`reports/apps/ai-service/evals/live-history/`.

Live mode requires provider credentials via CLI flags or environment variables:

- `AI_SERVICE_EVAL_PROVIDER`
- `AI_SERVICE_EVAL_MODEL`
- `AI_SERVICE_EVAL_API_KEY`
- `AI_SERVICE_EVAL_BASE_URL` (optional)
- `AI_SERVICE_EVAL_MAX_TOKENS` (optional, defaults to `4096`)

## Internal auth contract

Internal endpoints use a shared-secret HMAC scheme. The caller must send:

- `X-Internal-Service`
- `X-Internal-Timestamp`
- `X-Internal-Content-SHA256`
- `X-Internal-Signature`

The signature payload format is:

```text
{service_name}
{HTTP_METHOD}
{request_path}
{unix_timestamp_seconds}
{body_sha256_hex}
```

`X-Internal-Signature` is the HMAC-SHA256 hex digest of that payload using
`SERVICE_SECRET`.

This is stronger than signing only the service name because the signature is now
bound to the exact body, endpoint path, and a short-lived timestamp window.

## Related architecture note

For a Chinese walkthrough of how `apps/ai-service` and `packages/ai` now work
together, see:

- [`docs/guides/development/coding-standards.md`](/D:/home/projects/memoflow/docs/guides/development/coding-standards.md)
