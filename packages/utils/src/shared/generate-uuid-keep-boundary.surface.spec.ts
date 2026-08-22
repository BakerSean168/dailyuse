import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateUUID as utilsGenerateUUID, isValidUUID } from './uuid';

/**
 * Residual 1131: generateUUID cross-package keep-boundary.
 * - utils generateUUID: crypto.randomUUID + Math.random fallback (cross-platform runtime)
 * - test-utils generateUUID: node:crypto randomUUID only (test fixtures)
 * Soft residual 993: AI createStreamId dual-retired sole remains separate (stream- prefix).
 * AI-VNEXT: the former app-vue AI isRecord residual is retired; unrelated UUID boundaries remain.
 * Soft residual 1135: newId library-backed uuid v4 keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('generateUUID cross-package keep-boundary (residual 1131)', () => {
  const dir = __dirname;
  const utilsUuid = readFileSync(resolve(dir, 'uuid.ts'), 'utf8');
  const testUtilsRandom = readFileSync(
    resolve(dir, '../../../test-utils/src/helpers/random.ts'),
    'utf8',
  );

  it('owns Residual 1131 keep-boundary markers on utils generateUUID (fallback)', () => {
    expect(utilsUuid).toContain('Residual 1131 keep-boundary');
    expect(utilsUuid).toMatch(/export function generateUUID\b/);
    expect(utilsUuid).toContain('globalThis.crypto');
    expect(utilsUuid).toContain('randomUUID');
    expect(utilsUuid).toContain('Math.random');
    expect(utilsUuid).toContain('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
    // must not hard-depend on node:crypto
    expect(utilsUuid).not.toContain("from 'node:crypto'");
    expect(utilsUuid).not.toContain('from "node:crypto"');
  });

  it('differs from test-utils node:crypto-only generateUUID (no force-merge)', () => {
    expect(testUtilsRandom).toContain('Residual 1131 keep-boundary');
    expect(testUtilsRandom).toContain('Soft residual 1131');
    expect(testUtilsRandom).toMatch(/export function generateUUID\b/);
    expect(testUtilsRandom).toContain("from 'node:crypto'");
    expect(testUtilsRandom).toContain('return randomUUID()');
    // randomString may use Math.random elsewhere; assert generateUUID body only
    const body = testUtilsRandom.match(/export function generateUUID\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('return randomUUID()');
    expect(body).not.toContain('Math.random');
    expect(body).not.toContain('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
    expect(body).not.toContain('globalThis.crypto');
  });

  it('runtime: utils generateUUID returns valid UUID shape', () => {
    const id = utilsGenerateUUID();
    expect(isValidUUID(id)).toBe(true);
    expect(utilsGenerateUUID()).not.toBe(utilsGenerateUUID());
  });

  it('documents residual 1131 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'generate-uuid-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1131');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
