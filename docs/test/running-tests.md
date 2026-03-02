# Running Tests

## Prerequisites

- **Node.js** and **pnpm** installed
- **Docker Desktop** running (for integration tests)
- Dependencies installed: `pnpm install`

## Starting the Test Database

Integration tests require a PostgreSQL container:

```bash
docker compose -f docker-compose.test.yml up -d
```

This starts `dailyuse-test-db` on port **5433** with:

- User: `test_user`
- Password: `test_pass`
- Database: `dailyuse_test`

Verify it's running:

```bash
docker ps | grep dailyuse-test-db
```

## Running Tests

### All Projects

```bash
pnpm vitest run
```

Runs all 12 projects. Projects with no test files pass automatically (`passWithNoTests: true`).

### Single Project

```bash
pnpm vitest run --project task           # 527 unit tests
pnpm vitest run --project task-integration  # 60 integration tests (needs DB)
pnpm vitest run --project api-smoke       # 58 smoke tests
pnpm vitest run --project utils           # 23 utility tests
```

### Watch Mode

```bash
pnpm vitest --project task
```

### Specific Test File

```bash
pnpm vitest run packages/task/src/api/controllers/__tests__/task-template.controller.test.ts
```

### With Coverage

```bash
pnpm vitest run --coverage
```

Coverage is configured with `v8` provider. Reports go to `./coverage/` in text, JSON, HTML, and lcov formats.

## CI Mode

In CI environments (`CI=true`):

- Reporter switches to `['verbose', 'json', 'html']`
- Bail is set to `1` (stop on first failure)

```bash
CI=true pnpm vitest run
```

## Project-Specific Notes

### `task-integration`

- Requires Docker PostgreSQL on port 5433
- Runs files **sequentially** (`fileParallelism: false`)
- All files in a **single fork** (`singleFork: true`) to share DB state
- Global setup runs Prisma schema sync before tests
- 30s timeout per test

### `api-smoke`

- No database required (repositories are mocked)
- Uses Supertest to drive Express HTTP endpoints
- 15s timeout per test

### `api`

- Excludes `src/__tests__/smoke/**` (those run under `api-smoke`)
- Currently has no non-smoke test files

### `web`

- Uses `happy-dom` environment
- Includes Vue plugin (`@vitejs/plugin-vue`)
- CSS modules configured with `non-scoped` class names

### `domain-server` / `domain-client`

- Use `pool: 'forks'` with `singleFork: false`
- Have setup files at `./src/test/setup.ts`
