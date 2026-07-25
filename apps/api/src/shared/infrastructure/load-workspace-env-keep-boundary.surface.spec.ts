import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1047: loadWorkspaceEnv shape-mismatch keep-boundary.
 * database: preserves process.env then re-applies + normalizes postgres localhost→127.0.0.1.
 * api scripts: plain sequential dotenv load without preserve/normalize.
 * Soft residual 1048: tip focused suite numbers track Residual 1048 evidence tip (314/1359).
 * Does not flip §13.2 checkboxes.
 */
describe('loadWorkspaceEnv keep-boundary (residual 1047)', () => {
  const root = resolve(__dirname, '../../../../..');
  const database = readFileSync(
    resolve(root, 'packages/database/src/load-workspace-env.ts'),
    'utf8',
  );
  const apiScripts = readFileSync(
    resolve(root, 'apps/api/scripts/_shared/load-workspace-env.ts'),
    'utf8',
  );

  it('database sole preserves env and normalizes postgres loopback hosts', () => {
    expect(database).toContain('Residual 1047');
    expect(database).toMatch(/export function loadWorkspaceEnv\b/);
    expect(database).toContain('preservedEntries');
    expect(database).toContain('normalizePostgresLoopbackUrl');
    expect(database).toContain("url.hostname = '127.0.0.1'");
    expect(database).toContain("'DATABASE_URL'");
    expect(database).toContain("'DIRECT_URL'");
    expect(database).toContain("'SHADOW_DATABASE_URL'");
  });

  it('api scripts loader stays plain dotenv load without preserve/normalize dual merge', () => {
    expect(apiScripts).toContain('Residual 1047');
    expect(apiScripts).toMatch(/export function loadWorkspaceEnv\b/);
    expect(apiScripts).toContain('loadEnvFile');
    expect(apiScripts).toContain('.env.local');
    expect(apiScripts).not.toContain('preservedEntries');
    expect(apiScripts).not.toContain('normalizePostgresLoopbackUrl');
    expect(apiScripts).not.toContain("url.hostname = '127.0.0.1'");
  });

  it('both load the same ordered workspace env file set', () => {
    for (const [label, source] of [
      ['database', database],
      ['apiScripts', apiScripts],
    ] as const) {
      expect(source, label).toContain("'.env'");
      expect(source, label).toContain('`.env.${nodeEnv}`');
      expect(source, label).toContain("'.env.local'");
      expect(source, label).toContain('`.env.${nodeEnv}.local`');
    }
  });

  it('keeps separate WORKSPACE_ROOT depths for package vs apps/api scripts', () => {
    // database/src → monorepo root is ../../../
    expect(database).toContain("resolve(__dirname, '../../../')");
    // apps/api/scripts/_shared → monorepo root is ../../../../
    expect(apiScripts).toContain("path.resolve(__dirname, '../../../..')");
  });
});
