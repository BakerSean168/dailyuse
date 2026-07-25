import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1037: goal/schedule/reminder/task integration-global-setup duals retired
 * onto test-utils setup sole.
 * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339).
 * Does not flip §13.2 checkboxes.
 */
describe('integration-global-setup dual retired (residual 1037)', () => {
  const sole = readFileSync(
    resolve(__dirname, '../../../test-utils/src/setup/integration-global-setup.ts'),
    'utf8',
  );
  const packages = ['goal', 'schedule', 'reminder', 'task'] as const;

  it('owns sole setup/teardown helper body', () => {
    expect(sole).toContain('Residual 1037');
    expect(sole).toMatch(/export async function setup\b/);
    expect(sole).toMatch(/export async function teardown\b/);
    expect(sole).toContain('ensureTestDatabase');
    expect(sole).toContain("from './database'");
  });

  it('package shims re-export sole without local dual bodies', () => {
    for (const pkg of packages) {
      const source = readFileSync(
        resolve(__dirname, `../../../${pkg}/src/__tests__/integration-global-setup.ts`),
        'utf8',
      );
      expect(source, pkg).toContain('Residual 1037');
      expect(source, pkg).toContain(
        "from '@dailyuse/test-utils/setup/integration-global-setup'",
      );
      expect(source, pkg).toContain('setup');
      expect(source, pkg).toContain('teardown');
      expect(source, pkg).not.toMatch(/export async function setup\b/);
      expect(source, pkg).not.toMatch(/export async function teardown\b/);
      expect(source, pkg).not.toContain('ensureTestDatabase');
    }
  });

  it('integration vitest configs alias globalSetup to test-utils sole', () => {
    for (const pkg of packages) {
      const source = readFileSync(
        resolve(__dirname, `../../../${pkg}/vitest.integration.config.ts`),
        'utf8',
      );
      expect(source, pkg).toContain('Residual 1037');
      expect(source, pkg).toContain(
        '../test-utils/src/setup/integration-global-setup.ts',
      );
      expect(source, pkg).not.toContain(
        "./src/__tests__/integration-global-setup.ts",
      );
    }
  });

  it('sole setup is a thin ensureTestDatabase bootstrap without disconnect teardown', () => {
    expect(sole).toMatch(/export async function setup\(\)\s*\{\s*await ensureTestDatabase\(\);\s*\}/);
    expect(sole).toMatch(/export async function teardown\(\)\s*\{\s*\}/);
    expect(sole).not.toContain('disconnect');
  });
});
