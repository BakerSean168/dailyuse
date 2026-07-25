import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1141: toMillis / toTimestamp keep-boundary.
 * - auth PowerSync toMillis: string|null|undefined → number|null (ISO empty/invalid → null)
 * - notification PowerSync toTimestamp: same private string→null shape (co-located; no shared sole)
 * - data-portability projection toTimestamp: unknown → number|undefined
 * Soft residual 1101: AI positive-only + app-react 0-fallback remain separate.
 * Does not flip §13.2 checkboxes.
 */
describe('toMillis/toTimestamp keep-boundary (residual 1141)', () => {
  const dir = __dirname;
  const authMapper = readFileSync(resolve(dir, 'powersync-auth-identity.mapper.ts'), 'utf8');
  const notificationRepo = readFileSync(
    resolve(
      dir,
      '../../../../../../../notification/src/server/infrastructure/adapters/powersync/notification-powersync.repository.ts',
    ),
    'utf8',
  );
  const projectionHelpers = readFileSync(
    resolve(
      dir,
      '../../../../../../../data-portability/src/server/application/use-cases/projections/projection-helpers.ts',
    ),
    'utf8',
  );

  it('owns Residual 1141 keep-boundary markers on auth toMillis (string→null)', () => {
    expect(authMapper).toContain('Residual 1141 keep-boundary');
    expect(authMapper).toMatch(/function toMillis\b/);
    expect(authMapper).toContain('string | null | undefined');
    expect(authMapper).toContain('number | null');
    expect(authMapper).toContain('new Date(value).getTime()');
    expect(authMapper).toContain('Number.isNaN');
    const body = authMapper.match(/function toMillis\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('return null');
    expect(body).not.toContain('return undefined');
    expect(body).not.toContain('return 0');
    expect(body).not.toContain('value: unknown');
    expect(body).not.toContain('value instanceof Date');
  });

  it('differs from projection unknown→undefined toTimestamp (no force-merge)', () => {
    expect(projectionHelpers).toContain('Soft residual 1141');
    expect(projectionHelpers).toContain('Residual 1101 keep-boundary');
    expect(projectionHelpers).toMatch(/export function toTimestamp\b/);
    expect(projectionHelpers).toContain('value: unknown');
    expect(projectionHelpers).toContain('number | undefined');
    expect(projectionHelpers).toContain('value instanceof Date');
    // projection must not use auth toMillis name/body as sole
    const body =
      projectionHelpers.match(/export function toTimestamp\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).not.toContain('return null');
    expect(body).not.toMatch(/function toMillis\b/);
  });

  it('documents notification same-shape PowerSync string→null without force-merge sole', () => {
    expect(notificationRepo).toContain('Soft residual 1141');
    expect(notificationRepo).toContain('Residual 1101 keep-boundary');
    expect(notificationRepo).toMatch(/function toTimestamp\b/);
    expect(notificationRepo).toContain('string | null | undefined');
    expect(notificationRepo).toContain('number | null');
    // notification stays toTimestamp-named; auth stays toMillis-named (co-located dual shape)
    expect(notificationRepo).not.toMatch(/function toMillis\b/);
    expect(authMapper).not.toMatch(/function toTimestamp\b/);
  });

  it('documents residual 1141 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'to-millis-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1141');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
