import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { delay } from './api-utils';

/**
 * Residual 1192: delay dual retired onto utils frontend sole.
 * - sole: packages/utils/src/frontend/api-utils.ts delay(ms)
 * - desktop IPC test-helpers + setup re-export/import sole
 * - web E2E run-ai-workspace-playwright imports sole
 * Soft residual 1189: getCorsOrigins keep-boundary remains separate.
 * Soft residual 1183: defaultExtractContext keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('delay dual retired (residual 1192)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'api-utils.ts'), 'utf8');
  const frontendIndex = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const desktopHelpers = readFileSync(
    resolve(dir, '../../../../apps/desktop/src/main/ipc/__tests__/test-helpers.ts'),
    'utf8',
  );
  const desktopSetup = readFileSync(
    resolve(dir, '../../../../apps/desktop/src/main/ipc/__tests__/setup.ts'),
    'utf8',
  );
  const e2eRunner = readFileSync(
    resolve(dir, '../../../../apps/web/e2e/helpers/run-ai-workspace-playwright.ts'),
    'utf8',
  );

  it('owns sole delay helper body and frontend barrel export', () => {
    expect(sole).toContain('Residual 1192');
    expect(sole).toMatch(/export function delay\b/);
    expect(sole).toContain('setTimeout');
    expect(sole).toContain('Promise');
    expect(frontendIndex).toContain("export * from './api-utils'");
    const body = sole.match(/export function delay\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('ms: number');
    expect(body).toContain('setTimeout(resolve');
  });

  it('retires desktop/e2e dual delay bodies onto utils frontend sole', () => {
    expect(desktopHelpers).toContain('Residual 1192');
    expect(desktopHelpers).toContain("from '@memoflow/utils/frontend'");
    expect(desktopHelpers).toMatch(/export \{ delay \}/);
    expect(desktopHelpers).not.toMatch(/function delay\b/);
    expect(desktopHelpers).not.toMatch(/export function delay\b/);

    expect(desktopSetup).toContain('Residual 1192');
    expect(desktopSetup).toContain("from '@memoflow/utils/frontend'");
    expect(desktopSetup).toContain('delay');
    expect(desktopSetup).not.toMatch(/new Promise\(resolve => setTimeout\(resolve/);

    expect(e2eRunner).toContain('Residual 1192');
    expect(e2eRunner).toContain("from '@memoflow/utils/frontend'");
    expect(e2eRunner).toContain('delay');
    expect(e2eRunner).not.toMatch(/function delay\b/);
  });

  it('runtime: sole delay resolves after at least requested ms', async () => {
    const started = Date.now();
    await delay(20);
    expect(Date.now() - started).toBeGreaterThanOrEqual(15);
  });

  it('documents residual 1192 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'delay-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1192');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
