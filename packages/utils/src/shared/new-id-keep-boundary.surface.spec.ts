import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateUUID, isValidUUID, newId } from './uuid';

/**
 * Residual 1135: newId / generateUUID keep-boundary within utils.
 * - newId: uuid package v4 (library-backed; preferred production allocation)
 * - generateUUID: crypto.randomUUID + Math.random fallback (no uuid package dependency)
 * Soft residual 1131: test-utils node:crypto-only generateUUID remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('newId/generateUUID keep-boundary (residual 1135)', () => {
  const dir = __dirname;
  const uuid = readFileSync(resolve(dir, 'uuid.ts'), 'utf8');

  it('owns Residual 1135 keep-boundary markers on newId (uuid package)', () => {
    expect(uuid).toContain('Residual 1135 keep-boundary');
    expect(uuid).toMatch(/export const newId\b/);
    expect(uuid).toContain("from 'uuid'");
    expect(uuid).toContain('uuidv4()');
    // newId must not be the Math.random fallback body
    const newIdBody = uuid.match(/export const newId[\s\S]*?;/)?.[0] ?? '';
    expect(newIdBody).toContain('uuidv4()');
    expect(newIdBody).not.toContain('Math.random');
    expect(newIdBody).not.toContain('randomUUID');
  });

  it('differs from generateUUID crypto/fallback keep-boundary (no force-merge)', () => {
    expect(uuid).toContain('Soft residual 1135');
    expect(uuid).toMatch(/export function generateUUID\b/);
    expect(uuid).toContain('globalThis.crypto');
    expect(uuid).toContain('Math.random');
    expect(uuid).toContain('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
    // generateUUID must not call uuid package
    const body = uuid.match(/export function generateUUID\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).not.toContain('uuidv4');
    expect(body).not.toContain("from 'uuid'");
  });

  it('runtime: both produce valid UUID shapes', () => {
    expect(isValidUUID(newId())).toBe(true);
    expect(isValidUUID(generateUUID())).toBe(true);
    expect(newId()).not.toBe(newId());
    expect(generateUUID()).not.toBe(generateUUID());
  });

  it('documents residual 1135 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'new-id-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1135');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
