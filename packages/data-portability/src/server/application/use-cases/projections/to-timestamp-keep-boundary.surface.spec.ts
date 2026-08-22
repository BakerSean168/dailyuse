import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toTimestamp } from './projection-helpers';

/**
 * Residual 1101: toTimestamp cross-package keep-boundary.
 * - data-portability projection: unknown → number|undefined (any number + Date + Date.parse)
 * - AI-vNext: the legacy goal-planning chat-execution timestamp helper is retired
 * - notification PowerSync: string|null|undefined → number|null
 * Soft residual: app-react entity-presentation 0-fallback remains separate.
 * Soft residual 1095/1099: parseJsonField + asRecord/toRecord keep-boundaries remain.
 * Soft residual 1105: AI toNumber keep-boundary remains separate (number-only vs string parse).
 * Soft residual 1123: toDate/toDateString keep-boundary remains separate.
 * Soft residual 1141: auth PowerSync toMillis string→null co-located keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('toTimestamp cross-package keep-boundary (residual 1101)', () => {
  const dir = __dirname;
  const helpers = readFileSync(resolve(dir, 'projection-helpers.ts'), 'utf8');
  const legacyAiGoalPlanningPath = resolve(
    dir,
    '../../../../../../ai/src/server/infrastructure/chat-execution/goal-planning-response.ts',
  );
  const notificationRepo = readFileSync(
    resolve(
      dir,
      '../../../../../../notification/src/server/infrastructure/adapters/powersync/notification-powersync.repository.ts',
    ),
    'utf8',
  );
  const appReactPresentation = readFileSync(
    resolve(dir, '../../../../../../app-react/src/utils/entity-presentation.ts'),
    'utf8',
  );

  it('owns Residual 1101 keep-boundary markers on projection toTimestamp', () => {
    expect(helpers).toContain('Residual 1101 keep-boundary');
    expect(helpers).toMatch(/export function toTimestamp\b/);
    expect(helpers).toContain('value: unknown');
    expect(helpers).toContain('number | undefined');
    expect(helpers).toContain('value instanceof Date');
    expect(helpers).toContain("typeof value === 'number'");
    // must not force null or 0 fallback
    expect(helpers).not.toMatch(/export function toTimestamp[\s\S]{0,300}return null/);
    expect(helpers).not.toMatch(/export function toTimestamp[\s\S]{0,300}return 0/);
  });

  it('keeps the retired AI goal-planning chat-execution helper deleted', () => {
    expect(existsSync(legacyAiGoalPlanningPath)).toBe(false);
  });

  it('differs from notification PowerSync string→null toTimestamp (no force-merge)', () => {
    expect(notificationRepo).toContain('Residual 1101 keep-boundary');
    expect(notificationRepo).toContain('Soft residual 1101');
    expect(notificationRepo).toMatch(/function toTimestamp\b/);
    expect(notificationRepo).toContain('string | null | undefined');
    expect(notificationRepo).toContain('number | null');
    expect(notificationRepo).toContain('return null');
    // notification must not accept unknown / Date / any number body
    expect(notificationRepo).not.toMatch(/function toTimestamp\(value: unknown\)/);
    expect(notificationRepo).not.toContain('value instanceof Date');
  });

  it('documents app-react 0-fallback soft residual without force-merge', () => {
    expect(appReactPresentation).toContain('Soft residual 1101');
    expect(appReactPresentation).toMatch(/function toTimestamp\b/);
    expect(appReactPresentation).toContain('return 0');
    expect(appReactPresentation).toContain('number | string | null | undefined');
  });

  it('runtime: projection accepts any number/Date and uses undefined not null/0', () => {
    expect(toTimestamp(0)).toBe(0);
    expect(toTimestamp(-5)).toBe(-5);
    expect(toTimestamp(1700000000000)).toBe(1700000000000);
    expect(toTimestamp(new Date('2020-01-01T00:00:00.000Z'))).toBe(Date.parse('2020-01-01T00:00:00.000Z'));
    expect(toTimestamp('2020-01-01T00:00:00.000Z')).toBe(Date.parse('2020-01-01T00:00:00.000Z'));
    expect(toTimestamp(null)).toBeUndefined();
    expect(toTimestamp(undefined)).toBeUndefined();
    expect(toTimestamp('')).toBeUndefined();
    expect(toTimestamp('not-a-date')).toBeUndefined();
    expect(toTimestamp({})).toBeUndefined();
  });

  it('documents residual 1101 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'to-timestamp-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1101');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
