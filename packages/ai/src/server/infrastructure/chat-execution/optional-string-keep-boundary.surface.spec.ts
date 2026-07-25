import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1117: optional string coercion keep-boundary.
 * - data-portability schedule.importer optionalString: null/undefined → null; else String(value)
 * - AI goal-planning toNonEmptyString/toOptionalString: non-empty trimmed string | undefined
 * Soft residual 1099/1105/1109: asRecord / toNumber / toStringArray keep-boundaries remain.
 * Soft residual 1121: Host/runtime asNonEmptyString dual retired sole remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('optionalString/toNonEmptyString keep-boundary (residual 1117)', () => {
  const dir = __dirname;
  const goalPlanning = readFileSync(resolve(dir, 'goal-planning-response.ts'), 'utf8');
  const scheduleImporter = readFileSync(
    resolve(
      dir,
      '../../../../../data-portability/src/server/application/use-cases/importers/schedule.importer.ts',
    ),
    'utf8',
  );

  it('owns Residual 1117 keep-boundary markers on AI toNonEmptyString (trim + undefined)', () => {
    expect(goalPlanning).toContain('Residual 1117 keep-boundary');
    expect(goalPlanning).toContain('Soft residual 1117');
    expect(goalPlanning).toMatch(/function toNonEmptyString\b/);
    expect(goalPlanning).toMatch(/function toOptionalString\b/);
    expect(goalPlanning).toContain("typeof value === 'string' && value.trim()");
    expect(goalPlanning).toContain('return toNonEmptyString(value)');
    // AI must not coerce via String(value) or return null
    expect(goalPlanning).not.toMatch(/function toNonEmptyString[\s\S]{0,200}String\(value\)/);
    expect(goalPlanning).not.toMatch(/function toNonEmptyString[\s\S]{0,200}: string \| null/);
  });

  it('differs from data-portability schedule optionalString null+String coerce (no force-merge)', () => {
    expect(scheduleImporter).toContain('Residual 1117 keep-boundary');
    expect(scheduleImporter).toContain('Soft residual 1117');
    expect(scheduleImporter).toMatch(/function optionalString\b/);
    expect(scheduleImporter).toContain('string | null');
    expect(scheduleImporter).toContain('String(value)');
    expect(scheduleImporter).toContain('value === null || value === undefined ? null');
    // soft residual may name trim; schedule must not require string+trim
    expect(scheduleImporter).not.toMatch(/function optionalString[\s\S]{0,200}value\.trim\(/);
    expect(scheduleImporter).not.toMatch(/function toNonEmptyString\b/);
  });

  it('documents residual 1117 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'optional-string-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1117');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
