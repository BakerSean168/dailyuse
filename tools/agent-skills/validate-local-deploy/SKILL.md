---
name: validate-local-deploy
description: Run repository-specific post-change local deployment verification and generate a machine-readable plus human-readable report. Use when code changes are complete and Codex needs to validate the repo according to its existing workflow before further fixes or before opening/pushing a PR, especially for Docker, runtime, env injection, startup chain, or release/deployment related changes.
---

# Validate Local Deploy

Use this skill after implementation is complete and the task has entered verification. Keep this skill thin: select repository-owned commands, run them, and summarize the result. Do not invent a parallel checklist or a replacement deployment path.

## Run the Workflow

1. Confirm the repo root and run from there.
2. Read `AGENT.md` plus the repository deployment workflow docs named in [references/validation-policy.md](./references/validation-policy.md) if the current repo is unfamiliar.
3. Run the helper script from the repo root:

```bash
node ./tools/agent-skills/validate-local-deploy/scripts/run-validation.mjs --workspace <repo-root>
```

> If the repo stores the skill elsewhere, locate `run-validation.mjs` with `find . -name run-validation.mjs` first.

4. Let the script inspect the current working tree and compare against `main`.
5. Let the script choose the minimum required repository command set:
   - docs or governance only: run the governance check
   - code or config changes: run `pnpm nx affected -t lint`, `pnpm nx affected -t typecheck`, and `pnpm nx affected -t test`
   - runtime or deployment sensitive changes: additionally run `pnpm docker:local:up` or `pnpm docker:local:rebuild`
6. Read the generated report under `reports/local-deploy-validation/`.

## Use The Real Local Environment

- The final validation conclusion should come from the repository's real local environment, not from a sandbox-restricted approximation.
- If a command depends on Docker daemon access, user-level caches, `uv`, local credentials, or other host resources, rerun the skill outside the sandbox before declaring the branch failed.
- Treat sandbox-only access failures as environment blockers or inconclusive validation, not as proof that the code is broken.

## Enforce the Repository Policy

- Reuse the repository commands that already exist.
- Prefer direct `pnpm nx ...` and `pnpm docker:local:*` entrypoints over any new wrapper logic.
- Treat Docker validation as mandatory when the repository policy says runtime or deployment-sensitive changes require it.
- If Docker validation is required but Docker, `.env.production.local`, or another prerequisite is missing or inaccessible, mark the report as inconclusive and block PR readiness.
- If any required command fails, mark the report as failed and blocked.
- If Nx prints flaky-task warnings but the command exits `0`, keep the validation result as passed and surface the flaky tasks as warnings.
- Do not claim the repo is ready for PR unless every required check passed.

## Summarize the Outcome

- Use `latest.md` for human-facing summary.
- Use `latest.json` for machine-readable state, follow-up fixes, or PR assembly.
- When blocked, summarize:
  - which commands failed or were skipped
  - which services were unhealthy
  - which evidence files or log excerpts matter
  - the next concrete repair action
- When passed, summarize:
  - what changed
  - which validations ran
  - that local deployment verification is complete
  - that the branch is ready for PR from a validation standpoint

## Use Optional Flags

- Change the baseline branch with `--base-ref <branch>`.
- Change the output location with `--report-dir <relative-path>`.
- Use `--include-uncommitted false` if only committed diff should drive scope.
- Use `--dry-run true` only to inspect planned validation scope. A dry run never marks the repo as ready for PR.

## Resources

- Use [references/validation-policy.md](./references/validation-policy.md) when the repo's local deployment standard must be reloaded into context.
- Use `tools/agent-skills/validate-local-deploy/scripts/run-validation.mjs` (repo-relative) as the default executor instead of rewriting the validation logic inline.
