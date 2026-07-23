import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { errorMessage } from './error-message';
import { withCause } from './persistence';

/**
 * Residual 1127: extractErrorMessage dual retired onto errorMessage sole.
 * persistence withCause imports errorMessage; extractErrorMessage export removed.
 * Soft residual 999/1019: errorMessage dual-retired sole remains for AI/local-vault/CLI.
 * Does not flip §13.2 checkboxes.
 */
describe('extractErrorMessage dual retired (residual 1127)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'error-message.ts'), 'utf8');
  const persistence = readFileSync(resolve(dir, 'persistence.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');

  it('owns Residual 1127 dual-retired markers on errorMessage sole + withCause', () => {
    expect(sole).toContain('Residual 1127');
    expect(sole).toMatch(/export function errorMessage\b/);
    expect(sole).toContain('error instanceof Error');
    expect(sole).toContain('String(error)');
    expect(persistence).toContain('Residual 1127');
    expect(persistence).toContain("import { errorMessage } from './error-message'");
    expect(persistence).toMatch(/export function withCause\b/);
    expect(persistence).toContain('errorMessage(err)');
    // extractErrorMessage dual body must not remain
    expect(persistence).not.toMatch(/function extractErrorMessage\b/);
    expect(persistence).not.toMatch(/export function extractErrorMessage\b/);
  });

  it('shared barrel still exports errorMessage sole (not extractErrorMessage)', () => {
    expect(index).toContain("export * from './error-message'");
    expect(index).toContain("export * from './persistence'");
    // soft residual may mention name; assert no extract dual export reintroduction in error-message
    expect(sole).not.toMatch(/export function extractErrorMessage\b/);
  });

  it('runtime: withCause uses errorMessage coercion shape', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage('plain')).toBe('plain');
    expect(withCause('failed', new Error('cause'))).toBe('failed [cause: cause]');
    expect(withCause('failed', 'plain-cause')).toBe('failed [cause: plain-cause]');
    expect(withCause('failed', 42)).toBe('failed [cause: 42]');
  });

  it('documents residual 1127 dual-retired lock without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'extract-error-message-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1127');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
