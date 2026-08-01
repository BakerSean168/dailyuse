import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const WORKSPACE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(WORKSPACE_ROOT, path), 'utf8');
}

describe('production database initialization seam', () => {
  it('runs as a one-shot migrator before the API container', () => {
    const compose = readWorkspaceFile('docker-compose.local.yml');
    const migratorIndex = compose.indexOf('  migrator:');
    const apiIndex = compose.indexOf('  api:');

    expect(migratorIndex).toBeGreaterThan(-1);
    expect(apiIndex).toBeGreaterThan(migratorIndex);
    expect(compose).toContain('condition: service_completed_successfully');
  });

  it('keeps Prisma CLI and TypeScript loaders outside the API runtime', () => {
    const dockerfile = readWorkspaceFile('Dockerfile.api');
    const apiRuntime = dockerfile.slice(dockerfile.indexOf('FROM node-base AS api-runtime'));

    expect(apiRuntime).toContain('CMD ["node", "dist/main.js"]');
    expect(apiRuntime).not.toContain('prisma');
    expect(apiRuntime).not.toContain('tsx');
    expect(apiRuntime).not.toContain('packages/database');
  });

  it('publishes a dedicated migrator runtime target', () => {
    const dockerfile = readWorkspaceFile('Dockerfile.api');
    const migratorRuntime = dockerfile.slice(
      dockerfile.indexOf('FROM node-base AS migrator-runtime'),
      dockerfile.indexOf('FROM node-base AS api-runtime'),
    );

    expect(migratorRuntime).toContain('/prod/migrator/node_modules');
    expect(migratorRuntime).toContain('CMD ["node", "dist/main.js"]');
  });
});
