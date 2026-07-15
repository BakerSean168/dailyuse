import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const workspaceRoot = resolve(process.cwd(), '../..');
const apiRoot = process.cwd();
const databaseRoot = resolve(workspaceRoot, 'packages/database');
const migrationsDir = resolve(workspaceRoot, 'packages/database/prisma/migrations');

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (!process.env.DB_HOST) {
    throw new Error('DATABASE_URL or DB_HOST must be set before starting the API container');
  }

  const username = encodeURIComponent(process.env.DB_USER || 'dailyuse');
  const password = process.env.DB_PASSWORD
    ? `:${encodeURIComponent(process.env.DB_PASSWORD)}`
    : '';
  const port = process.env.DB_PORT || '5432';
  const database = encodeURIComponent(process.env.DB_NAME || 'dailyuse');
  const url = `postgresql://${username}${password}@${process.env.DB_HOST}:${port}/${database}?schema=public`;
  process.env.DATABASE_URL = url;
  return url;
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 1}`);
  }
}

function hasMigrations() {
  if (!existsSync(migrationsDir)) {
    return false;
  }

  return readdirSync(migrationsDir, { withFileTypes: true }).some((entry) => {
    if (!entry.isDirectory()) {
      return false;
    }

    return existsSync(resolve(migrationsDir, entry.name, 'migration.sql'));
  });
}

async function main() {
  resolveDatabaseUrl();

  console.log('[startup] Initializing database schema...');
  console.log('[startup] Preparing pgvector before Prisma schema reconciliation...');
  run(
    'pnpm',
    ['exec', 'tsx', './scripts/prepare-ai-knowledge-index-pgvector.ts'],
    databaseRoot,
  );
  if (hasMigrations()) {
    run(
      'pnpm',
      ['exec', 'prisma', 'migrate', 'deploy', '--config', './prisma/prisma.config.ts'],
      databaseRoot,
    );
  } else {
    console.log('[startup] No Prisma migration directories found. Falling back to prisma db push.');
    console.log('[startup] Preparing editor workspace natural key...');
    run(
      'pnpm',
      ['exec', 'tsx', './scripts/prepare-editor-workspace-natural-key.ts'],
      databaseRoot,
    );
    run('pnpm', ['exec', 'prisma', 'db', 'push', '--config', './prisma/prisma.config.ts'], databaseRoot);
  }

  console.log('[startup] Bootstrapping AI knowledge index...');
  run('pnpm', ['exec', 'tsx', './scripts/bootstrap-ai-knowledge-index.ts'], databaseRoot);

  console.log('[startup] Verifying required AI knowledge-index structures...');
  run(
    'pnpm',
    ['exec', 'tsx', './scripts/verify-ai-knowledge-index.ts', '--require-pgvector'],
    databaseRoot,
  );

  console.log('[startup] Starting API process...');
  const child = spawn('node', ['--import', 'tsx', 'dist/main.js'], {
    cwd: apiRoot,
    env: process.env,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error('[startup] Failed to initialize API container');
  console.error(error);
  process.exit(1);
});
