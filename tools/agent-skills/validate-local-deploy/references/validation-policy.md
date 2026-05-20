# Validation Policy

Load this file when the repository's post-change validation workflow matters more than generic coding checks.

## Core Rule

- Follow the current repository workflow instead of inventing a new release checklist.
- After code changes are complete, validate locally before opening or pushing a PR.
- The authoritative result comes from the real local environment that can access Docker, host caches, and repo-owned toolchains.

## Repository Rules To Reuse

- `AGENT.md`
  - Read the "本地验证与发布主线" and "最小验证" sections.
  - If the change touches Docker, runtime behavior, env injection, deployment chain, or production images, local Docker validation is mandatory before PR.
- `docs/guides/development/local.docker.md`
  - Treat `docker-compose.local.yml` as the prod-like local validation entrypoint.
  - Required healthy services for local deployment verification:
    - `api`
    - `web`
    - `ai-service`
    - `powersync`
- `docs/guides/development/release-workflow.md`
  - The default path is local Docker validation first, PR second, release workflow after merge.

## Validation Selection Heuristic

- Docs or governance only:
  - Run `pnpm nx run daily-use:governance-check`
- Code or config changes:
  - Run `pnpm nx affected -t lint --base <branch>`
  - Run `pnpm nx affected -t typecheck --base <branch>`
  - Run `pnpm nx affected -t test --base <branch>`
- Runtime or deployment-sensitive changes:
  - Also run one of:
    - `pnpm docker:local:up`
    - `pnpm docker:local:rebuild` for Dockerfile, compose, or `tools/docker` changes

## Interpretation Rules

- If a validation command exits non-zero because the local environment cannot access Docker, `uv` cache directories, or other host prerequisites, report the run as inconclusive or blocked by environment access rather than as a code failure.
- If `pnpm nx ...` exits `0` but prints `Nx detected flaky task` or `Nx detected flaky tasks`, record that as a warning only. Do not downgrade a successful validation to failed on that signal alone.

## Report Contract

Write both:

- `reports/local-deploy-validation/latest.json`
- `reports/local-deploy-validation/latest.md`

The report must answer:

- What changed
- Which validation rules were triggered
- Which repository commands ran
- Which commands failed or were skipped
- Which Docker services were healthy or unhealthy
- Whether the repo is ready for PR
- What to fix next if blocked
