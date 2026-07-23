import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toStringArray as knowledgeToStringArray } from './knowledge-index-value-helpers';
import { toStringArray as portableToStringArray } from '../../../../../data-portability/src/server/application/use-cases/projections/projection-helpers';

/**
 * Residual 1109: toStringArray cross-package keep-boundary.
 * - knowledge-index sole (969): typeof string filter, keeps empty, no trim, no JSON parse
 * - goal-planning private: trim + drop empty strings
 * - data-portability projection: parseJsonField first then typeof string filter
 * Soft residual 969: knowledge-index dual retired remains.
 * Soft residual 1095: parseJsonField keep-boundary remains (portable depends on it).
 * Soft residual 1113: data-portability toBoolean keep-boundary remains.
 * Does not flip §13.2 checkboxes.
 */
describe('toStringArray cross-package keep-boundary (residual 1109)', () => {
  const dir = __dirname;
  const knowledgeSole = readFileSync(resolve(dir, 'knowledge-index-value-helpers.ts'), 'utf8');
  const goalPlanning = readFileSync(
    resolve(dir, '../chat-execution/goal-planning-response.ts'),
    'utf8',
  );
  const projectionHelpers = readFileSync(
    resolve(
      dir,
      '../../../../../data-portability/src/server/application/use-cases/projections/projection-helpers.ts',
    ),
    'utf8',
  );

  it('owns Residual 1109 keep-boundary markers on knowledge-index toStringArray', () => {
    expect(knowledgeSole).toContain('Residual 1109 keep-boundary');
    expect(knowledgeSole).toContain('Soft residual 1109');
    expect(knowledgeSole).toMatch(/export function toStringArray\b/);
    expect(knowledgeSole).toContain("typeof item === 'string'");
    // soft residual may name trim/parseJsonField; sole body must not implement them
    expect(knowledgeSole).not.toMatch(/export function toStringArray[\s\S]{0,200}\.trim\(/);
    expect(knowledgeSole).not.toMatch(/export function toStringArray[\s\S]{0,200}parseJsonField\(/);
  });

  it('differs from goal-planning trim/non-empty toStringArray (no force-merge)', () => {
    expect(goalPlanning).toContain('Residual 1109 keep-boundary');
    expect(goalPlanning).toContain('Soft residual 1109');
    expect(goalPlanning).toMatch(/function toStringArray\b/);
    expect(goalPlanning).toContain('.trim()');
    expect(goalPlanning).toContain('item.length > 0');
    // soft residual may name parseJsonField; private body must not call it
    expect(goalPlanning).not.toMatch(/function toStringArray[\s\S]{0,250}parseJsonField\(/);
  });

  it('differs from portable parseJsonField toStringArray (no force-merge)', () => {
    expect(projectionHelpers).toContain('Residual 1109 keep-boundary');
    expect(projectionHelpers).toContain('Soft residual 1109');
    expect(projectionHelpers).toMatch(/export function toStringArray\b/);
    expect(projectionHelpers).toContain('parseJsonField(value, [])');
    expect(projectionHelpers).toContain("typeof item === 'string'");
    expect(projectionHelpers).not.toContain('.trim()');
  });

  it('runtime: knowledge-index keeps empty strings; portable parses JSON arrays', () => {
    expect(knowledgeToStringArray(['a', '', 'b', 1])).toEqual(['a', '', 'b']);
    expect(knowledgeToStringArray('["x"]')).toEqual([]);
    expect(portableToStringArray(['a', '', 'b', 1])).toEqual(['a', '', 'b']);
    expect(portableToStringArray('["x","", "y"]')).toEqual(['x', '', 'y']);
    expect(portableToStringArray(null)).toEqual([]);
  });

  it('documents residual 1109 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'to-string-array-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1109');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
