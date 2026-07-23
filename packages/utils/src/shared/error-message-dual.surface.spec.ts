import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { errorMessage } from './error-message';

/**
 * Residual 999: errorMessage dual retired (AI runtime + app-vue local vault).
 * Sole body in @dailyuse/utils/shared/error-message.
 * Soft residual 1008: tip focused suite numbers track Residual 1008 evidence tip (294/1279).
 * Soft residual: database knowledge-index scripts keep local toErrorMessage (CLI scripts).
 * Does not flip §13.2 checkboxes.
 */
describe('errorMessage dual retired (residual 999)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'error-message.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const aiRuntime = readFileSync(
    resolve(sharedDir, '../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
    'utf8',
  );
  const localVault = readFileSync(
    resolve(
      sharedDir,
      '../../../app-vue/src/modules/repository/composables/useLocalVault.ts',
    ),
    'utf8',
  );
  const databaseScript = readFileSync(
    resolve(
      sharedDir,
      '../../../database/scripts/prepare-ai-knowledge-index-pgvector.ts',
    ),
    'utf8',
  );

  it('owns sole errorMessage helper body and shared barrel export', () => {
    expect(sole).toContain('Residual 999');
    expect(sole).toMatch(/export function errorMessage\b/);
    expect(sole).toContain('error instanceof Error');
    expect(sole).toContain('error.message');
    expect(sole).toContain('String(error)');
    expect(index).toContain("export * from './error-message'");
  });

  it('AI runtime + local vault import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['ai-runtime', aiRuntime],
      ['useLocalVault', localVault],
    ] as const) {
      expect(source, label).toContain('Residual 999');
      expect(source, label).toContain("import { errorMessage } from '@dailyuse/utils/shared'");
      expect(source, label).not.toMatch(/function errorMessage\b/);
      expect(source, label).toContain('errorMessage(');
    }
  });

  it('database knowledge-index scripts remain keep-boundary (local toErrorMessage)', () => {
    expect(databaseScript).toMatch(/function toErrorMessage\b/);
    expect(databaseScript).toContain('error instanceof Error');
    expect(databaseScript).not.toContain('@dailyuse/utils/shared');
  });

  it('coerces Error and non-Error values to message strings', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('plain')).toBe('plain');
    expect(errorMessage(42)).toBe('42');
    expect(errorMessage(null)).toBe('null');
    expect(errorMessage(undefined)).toBe('undefined');
  });
});
