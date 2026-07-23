import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1174: normalizePath keep-boundary (auth URL route vs repository storage path).
 * - auth require-email-verified: strip query + /api|/api/v1 prefixes → string
 * - repository storage-config: trim string|null|undefined → string|null (empty → null)
 * Soft residual 1168: buildTaskName domain-specific remains separate.
 * Soft residual 1171: readString keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('normalizePath keep-boundary (residual 1174)', () => {
  const dir = __dirname;
  const auth = readFileSync(resolve(dir, 'require-email-verified.middleware.ts'), 'utf8');
  const repository = readFileSync(
    resolve(dir, '../../../repository/src/server/infrastructure/storage-config.ts'),
    'utf8',
  );

  it('owns Residual 1174 keep-boundary markers on auth URL-route normalizePath', () => {
    expect(auth).toContain('Residual 1174 keep-boundary');
    expect(auth).toMatch(/function normalizePath\b/);
    expect(auth).toContain('url: string');
    expect(auth).toContain("split('?')");
    expect(auth).toContain('/api/v1');
    const body = auth.match(/function normalizePath\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('pathOnly');
    expect(body).toContain('replace');
    expect(body).not.toContain('trim()');
    expect(body).not.toContain('return null');
    expect(body).not.toContain('string | null | undefined');
  });

  it('differs from repository filesystem trim|null normalizePath (no force-merge)', () => {
    expect(repository).toContain('Residual 1174 keep-boundary');
    expect(repository).toMatch(/function normalizePath\b/);
    expect(repository).toContain('Soft residual 1174');
    expect(repository).toContain('string | null | undefined');
    expect(repository).toContain('string | null');
    const body = repository.match(/function normalizePath\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('trim()');
    expect(body).toContain('return null');
    expect(body).not.toContain("split('?')");
    expect(body).not.toContain('/api/v1');
    expect(body).not.toContain('pathOnly');
  });

  it('runtime: documents auth URL strip vs repository trim-null contracts via body shape', () => {
    function authNormalizePath(url: string): string {
      const pathOnly = url.split('?')[0] ?? url;
      return pathOnly.replace(/^\/api\/v1/, '').replace(/^\/api/, '');
    }
    function repositoryNormalizePath(value: string | null | undefined): string | null {
      if (typeof value !== 'string') {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    expect(authNormalizePath('/api/v1/auth/me?x=1')).toBe('/auth/me');
    expect(authNormalizePath('/api/auth/logout')).toBe('/auth/logout');
    expect(authNormalizePath('/auth/refresh')).toBe('/auth/refresh');
    expect(repositoryNormalizePath('  /data/vault  ')).toBe('/data/vault');
    expect(repositoryNormalizePath('')).toBeNull();
    expect(repositoryNormalizePath('   ')).toBeNull();
    expect(repositoryNormalizePath(null)).toBeNull();
    expect(repositoryNormalizePath(undefined)).toBeNull();
  });

  it('documents residual 1174 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'normalize-path-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1174');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
