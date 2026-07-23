import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveExportRef, resolveExportRefOrThrow } from './projection-helpers';
import type { ExportContext } from '../../portable-runtime';
import { RefAllocator } from '../../portable-runtime';

/**
 * Residual 1017: goal/editor resolveRef dual retired onto residual 1003 sole.
 * Sole bodies in projection-helpers (entityLabel message domain).
 * Soft residual 1016: tip focused suite numbers track Residual 1016 evidence tip (298/1295)
 *   until residual 1018 suite re-run.
 * Soft residual 1003: task/reminder/repository already on sole.
 * Does not flip §13.2 checkboxes.
 */
describe('goal/editor resolveRef dual retired (residual 1017)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'projection-helpers.ts'), 'utf8');
  const goal = readFileSync(resolve(dir, 'goal.projection.ts'), 'utf8');
  const editor = readFileSync(resolve(dir, 'editor.projection.ts'), 'utf8');
  const task = readFileSync(resolve(dir, 'task.projection.ts'), 'utf8');

  it('owns sole resolveExportRef helpers used by residual 1017 consumers', () => {
    expect(sole).toContain('Residual 1003');
    expect(sole).toMatch(/export function resolveExportRef\b/);
    expect(sole).toMatch(/export function resolveExportRefOrThrow\b/);
    expect(sole).toContain('Unresolved ${entityLabel} reference to ${id}');
  });

  it('goal + editor import sole without local dual bodies', () => {
    for (const [label, source, entity] of [
      ['goal', goal, 'goal'],
      ['editor', editor, 'editor'],
    ] as const) {
      expect(source, label).toContain('Residual 1017');
      expect(source, label).toContain('resolveExportRef');
      expect(source, label).toContain(`'${entity}'`);
      expect(source, label).not.toMatch(/function resolveRef\b/);
      expect(source, label).not.toMatch(/function resolveRefOrThrow\b/);
      expect(source, label).not.toContain('entity may not have been exported');
    }
    expect(goal).toContain("resolveExportRefOrThrow");
    expect(goal).toContain("resolveExportRefOrThrow(");
  });

  it('task residual 1003 consumer remains sole; goal uses goal entityLabel', () => {
    expect(task).toContain('Residual 1003');
    expect(task).toContain("resolveExportRef");
    expect(goal).toContain("resolveExportRef(");
    expect(goal).toContain("'goal'");
    expect(editor).toContain("'editor'");
  });

  it('resolves mapped refs with goal/editor entityLabels', () => {
    const ctx: ExportContext = {
      identityId: 'id-1',
      exportedAt: new Date().toISOString(),
      refAllocator: new RefAllocator(),
      warnings: [],
      refToIdMap: new Map([
        ['uuid-goal', 'goal:1'],
        ['uuid-editor', 'editor:1'],
      ]),
    };
    expect(resolveExportRef(null, ctx, 'goal')).toBeNull();
    expect(resolveExportRef('uuid-goal', ctx, 'goal')).toBe('goal:1');
    expect(resolveExportRef('missing', ctx, 'goal')).toBeNull();
    expect(ctx.warnings.at(-1)).toContain('Unresolved goal reference to missing');
    expect(resolveExportRef('uuid-editor', ctx, 'editor')).toBe('editor:1');
    expect(resolveExportRefOrThrow('uuid-goal', ctx, 'goal')).toBe('goal:1');
    expect(() => resolveExportRefOrThrow('missing', ctx, 'goal')).toThrow(
      /EXPORT_VALIDATION_ERROR: Unresolved goal reference to missing/,
    );
  });
});
