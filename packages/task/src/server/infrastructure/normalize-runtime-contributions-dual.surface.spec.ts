import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isRuntimeContributionArray,
  normalizeRuntimeContributions,
} from './normalize-runtime-contributions';
import type { TaskModuleRuntimeContribution } from './task.module';

/**
 * Residual 987: runtime-contribution normalize dual retired (task API + Electron entry).
 * Sole body in normalize-runtime-contributions.ts.
 * Soft residual 990: tip focused suite numbers track Residual 990 evidence tip (285/1248).
 * Soft residual: server task.module.ts local normalizeRuntimeContributions remains keep-boundary
 * (composition-root + TaskRuntimeContributionsInput host; avoid circular import).
 * Does not flip §13.2 checkboxes.
 */
describe('normalizeRuntimeContributions dual retired (residual 987)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'normalize-runtime-contributions.ts'), 'utf8');
  const api = readFileSync(resolve(dir, '../../api/module.ts'), 'utf8');
  const electron = readFileSync(resolve(dir, '../../electron/index.ts'), 'utf8');
  const server = readFileSync(resolve(dir, 'task.module.ts'), 'utf8');

  it('owns sole isRuntimeContributionArray + normalizeRuntimeContributions bodies', () => {
    expect(sole).toContain('Residual 987');
    expect(sole).toMatch(/export function isRuntimeContributionArray\b/);
    expect(sole).toMatch(/export function normalizeRuntimeContributions\b/);
    expect(sole).toContain('Array.isArray(runtimeContributions)');
    expect(sole).toContain('Array.from(runtimeContributions)');
  });

  it('API + Electron entrypoints import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['api', api],
      ['electron', electron],
    ] as const) {
      expect(source, label).toContain('Residual 987');
      expect(source, label).toContain("from '../server/infrastructure/normalize-runtime-contributions'");
      expect(source, label).not.toMatch(/function isRuntimeContributionArray\b/);
      expect(source, label).not.toMatch(/function normalizeRuntimeContributions\b/);
      expect(source, label).toContain('normalizeRuntimeContributions(');
    }
  });

  it('server composition-root keeps local normalize as keep-boundary', () => {
    expect(server).toContain('function normalizeRuntimeContributions');
    expect(server).toContain('TaskRuntimeContributionsInput');
    expect(server).toContain('Residual 987');
  });

  it('normalizes missing / single / array contributions', () => {
    const a: TaskModuleRuntimeContribution = { start() {}, stop() {} };
    const b: TaskModuleRuntimeContribution = { start() {}, stop() {} };

    expect(normalizeRuntimeContributions(undefined)).toEqual([]);
    expect(normalizeRuntimeContributions(a)).toEqual([a]);
    expect(normalizeRuntimeContributions([a, b])).toEqual([a, b]);
    expect(isRuntimeContributionArray([a])).toBe(true);
    expect(isRuntimeContributionArray(a)).toBe(false);
  });
});
