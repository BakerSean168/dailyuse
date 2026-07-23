import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toRecord } from '../../../../../data-portability/src/server/application/use-cases/projections/projection-helpers';

/**
 * Residual 1099: asRecord/toRecord cross-package keep-boundary.
 * - AI goal-planning asRecord: plain-object or null (never empty {})
 * - data-portability schedule.importer asRecord: plain-object or {}
 * - data-portability projection toRecord: parseJsonField then plain-object or undefined
 * Soft residual 1095: parseJsonField keep-boundary remains (toRecord depends on it).
 * Soft residual 1089: isRecord plain-object vs envelope arrays remains separate.
 * Soft residual 1101: toTimestamp keep-boundary family (null/undefined/positive/0-fallback).
 * Soft residual 1105: toNumber keep-boundary (adapter number-only vs goal-planning string parse).
 * Soft residual 1117: optionalString/toNonEmptyString keep-boundary (null+String vs trim undefined).
 * Does not flip §13.2 checkboxes.
 */
describe('asRecord/toRecord cross-package keep-boundary (residual 1099)', () => {
  const dir = __dirname;
  const aiGoalPlanning = readFileSync(resolve(dir, 'goal-planning-response.ts'), 'utf8');
  const scheduleImporter = readFileSync(
    resolve(
      dir,
      '../../../../../data-portability/src/server/application/use-cases/importers/schedule.importer.ts',
    ),
    'utf8',
  );
  const projectionHelpers = readFileSync(
    resolve(
      dir,
      '../../../../../data-portability/src/server/application/use-cases/projections/projection-helpers.ts',
    ),
    'utf8',
  );

  it('owns Residual 1099 keep-boundary markers on AI asRecord (null fallback)', () => {
    expect(aiGoalPlanning).toContain('Residual 1099 keep-boundary');
    expect(aiGoalPlanning).toMatch(/function asRecord\b/);
    expect(aiGoalPlanning).toContain('Record<string, unknown> | null');
    expect(aiGoalPlanning).toContain(': null');
    // must not empty-object fallback
    expect(aiGoalPlanning).not.toMatch(/function asRecord[\s\S]{0,200}: \{\}/);
    expect(aiGoalPlanning).not.toContain('@dailyuse/data-portability');
  });

  it('differs from data-portability schedule asRecord {} fallback (no force-merge)', () => {
    expect(scheduleImporter).toContain('Residual 1099 keep-boundary');
    expect(scheduleImporter).toContain('Soft residual 1099');
    expect(scheduleImporter).toMatch(/function asRecord\b/);
    expect(scheduleImporter).toContain('Record<string, unknown>');
    expect(scheduleImporter).toMatch(/: \{\}/);
    // soft residual comments may name null (optionalString keep-boundary);
    // assert asRecord signature/body only — {} fallback, never null return
    expect(scheduleImporter).not.toMatch(
      /function asRecord\([^)]*\):\s*Record<string, unknown>\s*\|\s*null/,
    );
    const asRecordBody = scheduleImporter.match(/function asRecord\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(asRecordBody).toMatch(/: \{\}/);
    expect(asRecordBody).not.toMatch(/\breturn null\b/);
    expect(asRecordBody).not.toMatch(/:\s*null\b/);
  });

  it('differs from data-portability toRecord undefined fallback (no force-merge)', () => {
    expect(projectionHelpers).toContain('Residual 1099 keep-boundary');
    expect(projectionHelpers).toContain('Soft residual 1099');
    expect(projectionHelpers).toMatch(/export function toRecord\b/);
    expect(projectionHelpers).toContain('Record<string, unknown> | undefined');
    expect(projectionHelpers).toContain('return undefined');
    expect(projectionHelpers).toContain('parseJsonField(value)');
    // toRecord must not implement AI null asRecord body dual
    expect(projectionHelpers).not.toMatch(/function asRecord\b/);
  });

  it('runtime: toRecord uses undefined (not {} or null) for non-objects', () => {
    expect(toRecord({ a: 1 })).toEqual({ a: 1 });
    expect(toRecord('{"a":1}')).toEqual({ a: 1 });
    expect(toRecord(null)).toBeUndefined();
    expect(toRecord(undefined)).toBeUndefined();
    expect(toRecord('plain')).toBeUndefined();
    expect(toRecord([])).toBeUndefined();
    expect(toRecord('[1,2]')).toBeUndefined();
  });

  it('documents residual 1099 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'as-record-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1099');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
