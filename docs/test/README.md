# Test System Documentation

This directory documents the Memoflow monorepo test infrastructure.

## Contents

| Document                                   | Description                                                     |
| ------------------------------------------ | --------------------------------------------------------------- |
| [architecture.md](./architecture.md)       | Three-layer testing strategy, project layout, module resolution |
| [running-tests.md](./running-tests.md)     | How to run tests locally and in CI                              |
| [configuration.md](./configuration.md)     | Deep dive into `vitest.config.ts` and alias resolution          |
| [troubleshooting.md](./troubleshooting.md) | Common failures, Vite plugin vs alias gotchas, known issues     |

## Quick Reference

```bash
# Run all 12 test projects
pnpm vitest run

# Run a single project
pnpm vitest run --project task

# Run with watch mode
pnpm vitest --project task

# Start the test database (required for integration tests)
docker compose -f docker-compose.test.yml up -d
```

## Test Suite Summary

| Project          | Type                  | Tests                           | Environment       |
| ---------------- | --------------------- | ------------------------------- | ----------------- |
| contracts        | library               | 0 (no test files yet)           | node              |
| domain-server    | library               | 0 (no test files yet)           | node              |
| domain-client    | library               | 0 (no test files yet)           | happy-dom         |
| ui               | library               | 0 (no test files yet)           | happy-dom         |
| utils            | library               | 23                              | node              |
| task             | package (unit)        | 527                             | node              |
| task-integration | package (integration) | 60                              | node + PostgreSQL |
| api              | application           | 0 (no non-smoke test files yet) | node              |
| api-smoke        | application (smoke)   | 58                              | node              |
| desktop          | application           | 0 (no test files yet)           | happy-dom         |
| web              | application           | 0 (no test files yet)           | happy-dom         |

**Total: 668 tests across 34 test files, 12 projects**

