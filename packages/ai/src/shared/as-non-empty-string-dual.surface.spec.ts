import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { asNonEmptyString } from './as-non-empty-string';

/**
 * Residual 1121: asNonEmptyString dual retired (AI Host/runtime input binding).
 * Sole body in as-non-empty-string.ts; host start/resume + ai-runtime import it.
 * Soft residual 1117: goal-planning toNonEmptyString remains chat-parse keep-boundary
 * (same trim shape; intentionally not force-merged into schedule optionalString).
 * Does not flip §13.2 checkboxes.
 */
describe('asNonEmptyString dual retired (residual 1121)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'as-non-empty-string.ts'), 'utf8');
  const start = readFileSync(
    resolve(dir, '../server/infrastructure/runtime/host-task-create-start.ts'),
    'utf8',
  );
  const resume = readFileSync(
    resolve(dir, '../server/infrastructure/runtime/host-task-create-resume.ts'),
    'utf8',
  );
  const runtime = readFileSync(
    resolve(dir, '../server/infrastructure/runtime/ai-runtime.ts'),
    'utf8',
  );
  const goalPlanning = readFileSync(
    resolve(dir, '../server/infrastructure/chat-execution/goal-planning-response.ts'),
    'utf8',
  );

  it('owns sole asNonEmptyString helper body', () => {
    expect(sole).toContain('Residual 1121');
    expect(sole).toMatch(/export function asNonEmptyString\b/);
    expect(sole).toContain("typeof value === 'string' && value.trim().length > 0");
    expect(sole).toContain('value.trim()');
    expect(sole).toContain(': undefined');
    // must not coerce via String(value) or return null
    expect(sole).not.toContain('String(value)');
    expect(sole).not.toContain('string | null');
  });

  it('host start/resume + ai-runtime import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['start', start],
      ['resume', resume],
      ['runtime', runtime],
    ] as const) {
      expect(source, label).toContain('Residual 1121');
      expect(source, label).toContain(
        "import { asNonEmptyString } from '../../../shared/as-non-empty-string'",
      );
      expect(source, label).not.toMatch(/function asNonEmptyString\b/);
      expect(source, label).not.toMatch(/function asNonEmptyTrimmedString\b/);
      expect(source, label).toContain('asNonEmptyString(');
    }
  });

  it('differs from residual 1117 goal-planning private toNonEmptyString (no force-merge into schedule)', () => {
    expect(goalPlanning).toContain('Residual 1117 keep-boundary');
    expect(goalPlanning).toMatch(/function toNonEmptyString\b/);
    expect(goalPlanning).not.toContain('as-non-empty-string');
    // soft residual comments may name sole; assert function body not dual export
    expect(goalPlanning).not.toMatch(/export function asNonEmptyString\b/);
  });

  it('runtime: non-empty trim only; empty/whitespace/non-string → undefined', () => {
    expect(asNonEmptyString('  hello  ')).toBe('hello');
    expect(asNonEmptyString('x')).toBe('x');
    expect(asNonEmptyString('')).toBeUndefined();
    expect(asNonEmptyString('   ')).toBeUndefined();
    expect(asNonEmptyString(null)).toBeUndefined();
    expect(asNonEmptyString(undefined)).toBeUndefined();
    expect(asNonEmptyString(12)).toBeUndefined();
    expect(asNonEmptyString(true)).toBeUndefined();
  });

  it('documents residual 1121 dual-retired lock without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'as-non-empty-string-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1121');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
