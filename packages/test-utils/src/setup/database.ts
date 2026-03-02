/**
 * Test database lifecycle management
 *
 * Provides utilities for managing the Docker-based test PostgreSQL database:
 * - Starting/stopping the test container
 * - Waiting for database readiness
 * - Syncing Prisma schema
 * - Cleaning data between tests
 *
 * Used by globalSetup.ts and individual integration test files.
 *
 * @example
 * ```typescript
 * // In globalSetup.ts:
 * import { ensureTestDatabase, syncPrismaSchema } from '@dailyuse/test-utils/setup/database';
 *
 * export default async function globalSetup() {
 *   await ensureTestDatabase();
 *   syncPrismaSchema();
 * }
 *
 * // In integration test files:
 * import { cleanAllTables, getTestDatabaseUrl } from '@dailyuse/test-utils/setup/database';
 *
 * beforeEach(async () => {
 *   await cleanAllTables();
 * });
 * ```
 */

import { execFileSync, execSync } from 'node:child_process';
import { accessSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Constants ──────────────────────────────────────────────────────

const TEST_DB_USER = 'test_user';
const TEST_DB_PASS = 'test_pass';
const TEST_DB_NAME = 'dailyuse_test';
const TEST_DB_HOST = 'localhost';
const TEST_DB_PORT = 5433;
const TEST_DB_CONTAINER = 'dailyuse-test-db';
const COMPOSE_FILE = 'docker-compose.test.yml';

/**
 * The test database URL. Set this in process.env.DATABASE_URL before
 * running Prisma or connecting to the database.
 */
export const TEST_DATABASE_URL = `postgresql://${TEST_DB_USER}:${TEST_DB_PASS}@${TEST_DB_HOST}:${TEST_DB_PORT}/${TEST_DB_NAME}`;

// ─── Docker Container Management ────────────────────────────────────

/**
 * Check if the test database container is running.
 */
export function isContainerRunning(): boolean {
  try {
    const result = execFileSync(
      'docker',
      ['inspect', '-f', '{{.State.Running}}', TEST_DB_CONTAINER],
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    );
    return result.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Start the test database container using docker-compose.
 * If the container is already running, this is a no-op.
 *
 * @param projectRoot - Path to the monorepo root (where docker-compose.test.yml lives)
 */
export function startTestContainer(projectRoot?: string): void {
  if (isContainerRunning()) {
    console.log('[test-utils] Test database container already running');
    return;
  }

  console.log('[test-utils] Starting test database container...');
  const root = projectRoot ?? findProjectRoot();

  execFileSync('docker', ['compose', '-f', COMPOSE_FILE, 'up', '-d', '--wait'], {
    cwd: root,
    stdio: 'inherit',
  });

  console.log('[test-utils] Test database container started');
}

/**
 * Stop and remove the test database container.
 */
export function stopTestContainer(projectRoot?: string): void {
  if (!isContainerRunning()) return;

  console.log('[test-utils] Stopping test database container...');
  const root = projectRoot ?? findProjectRoot();

  execFileSync('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], {
    cwd: root,
    stdio: 'inherit',
  });
}

/**
 * Wait for PostgreSQL to be ready to accept connections.
 *
 * In CI environments (where `CI=true`), uses `pg_isready` directly against
 * the host since the DB runs as a GitHub Actions service container, not
 * inside a named Docker container.
 *
 * @param timeoutMs - Maximum time to wait (default 30s)
 * @throws Error if database is not ready within timeout
 */
export async function waitForDatabase(timeoutMs = 30_000): Promise<void> {
  const startedAt = Date.now();
  const isCI = process.env.CI === 'true';

  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (isCI) {
        // In CI, PostgreSQL runs as a service container on the host network.
        // Use pg_isready directly (available on ubuntu-latest).
        execFileSync(
          'pg_isready',
          ['-h', TEST_DB_HOST, '-p', String(TEST_DB_PORT), '-U', TEST_DB_USER, '-d', TEST_DB_NAME],
          { stdio: ['pipe', 'pipe', 'pipe'] },
        );
      } else {
        // Locally, PostgreSQL runs inside a named Docker container.
        execFileSync(
          'docker',
          ['exec', TEST_DB_CONTAINER, 'pg_isready', '-U', TEST_DB_USER, '-d', TEST_DB_NAME],
          { stdio: ['pipe', 'pipe', 'pipe'] },
        );
      }
      return; // ready
    } catch {
      await sleep(500);
    }
  }

  throw new Error(`[test-utils] Database not ready after ${timeoutMs}ms`);
}

// ─── Prisma Schema Management ──────────────────────────────────────

/**
 * Sync the Prisma schema to the test database.
 * Uses `prisma db push --skip-generate --accept-data-loss` for speed.
 *
 * Prisma 7 uses prisma.config.ts in packages/database/prisma/ which reads
 * DATABASE_URL from env. We pass the test DB URL via environment variable.
 *
 * @param prismaDir - Path to the directory containing prisma.config.ts
 */
export function syncPrismaSchema(prismaDir?: string): void {
  console.log('[test-utils] Syncing Prisma schema to test database...');

  const dir = prismaDir ?? resolve(findProjectRoot(), 'packages/database/prisma');

  // Prisma 7 removed --skip-generate; only --accept-data-loss remains
  execFileSync('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
    cwd: dir,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
  });

  console.log('[test-utils] Prisma schema synced');
}

// ─── High-Level Setup ──────────────────────────────────────────────

/**
 * Ensure the test database is running and schema is up-to-date.
 * This is the main entry point for globalSetup.ts.
 *
 * Steps:
 * 1. Start Docker container (if not running) — skipped in CI where DB is a service container
 * 2. Wait for PostgreSQL readiness
 * 3. Set environment variables
 * 4. Sync Prisma schema
 */
export async function ensureTestDatabase(projectRoot?: string): Promise<void> {
  const root = projectRoot ?? findProjectRoot();
  const isCI = process.env.CI === 'true';

  // Set env vars first — Prisma needs DATABASE_URL
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.JWT_SECRET = 'test-jwt-secret-key';

  if (isCI) {
    console.log('[test-utils] CI detected — skipping Docker container management');
  } else {
    startTestContainer(root);
  }

  await waitForDatabase();
  syncPrismaSchema(resolve(root, 'packages/database/prisma'));
}

/**
 * Get the test database URL. Convenience for tests that need the URL.
 */
export function getTestDatabaseUrl(): string {
  return TEST_DATABASE_URL;
}

// ─── Data Cleanup ──────────────────────────────────────────────────

/**
 * Truncate all tables in the test database.
 * Uses TRUNCATE ... CASCADE for speed.
 *
 * Call this in beforeEach() for integration tests to ensure a clean state.
 *
 * @param prisma - PrismaClient instance (to avoid importing @prisma/client here)
 */
export async function cleanAllTables(prisma: {
  $executeRawUnsafe: (query: string) => Promise<number>;
  $queryRawUnsafe: (query: string) => Promise<unknown[]>;
}): Promise<void> {
  const tables = (await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations'`,
  )) as Array<{ tablename: string }>;

  if (tables.length === 0) return;

  const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE`);
}

// ─── Internal Helpers ──────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Find the monorepo root by looking for docker-compose.test.yml
 * walking up from the current working directory.
 */
function findProjectRoot(): string {
  let dir = process.cwd();

  // Walk up to find the monorepo root (max 10 levels)
  for (let i = 0; i < 10; i++) {
    try {
      // Check if docker-compose.test.yml exists here
      const composeFile = resolve(dir, COMPOSE_FILE);
      accessSync(composeFile);
      return dir;
    } catch {
      dir = resolve(dir, '..');
    }
  }

  // Fallback: assume cwd is the root
  return process.cwd();
}
