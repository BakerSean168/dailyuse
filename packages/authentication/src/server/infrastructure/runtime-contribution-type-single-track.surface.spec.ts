import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 243: module runtime contribution types are single-track across packages.
 * Canonical type is *ModuleRuntimeContribution; short *RuntimeContribution dual aliases dropped.
 */
describe('cross-module runtime contribution type single-track surface', () => {
  const packagesRoot = resolve(__dirname, '../../../..');

  const modules = [
    'account',
    'notification',
    'data-portability',
    'repository',
    'goal',
    'task',
    'schedule',
    'reminder',
    'setting',
    'authentication',
  ] as const;

  it('runtime files do not dual-alias *RuntimeContribution to *ModuleRuntimeContribution', () => {
    let checked = 0;
    for (const pkg of modules) {
      const runtimeDir = resolve(packagesRoot, pkg, 'src/server/infrastructure/runtime');
      if (!existsSync(runtimeDir)) continue;
      const files = [
        'account.runtime.ts',
        'notification.runtime.ts',
        'data-portability.runtime.ts',
        'repository.runtime.ts',
        'goal.runtime.ts',
        'task.runtime.ts',
        'schedule.runtime.ts',
        'reminder.runtime.ts',
        'setting.runtime.ts',
        'authentication.runtime.ts',
      ];
      for (const file of files) {
        const path = resolve(runtimeDir, file);
        if (!existsSync(path)) continue;
        const src = readFileSync(path, 'utf8');
        expect(src, path).not.toMatch(
          /export type \w+RuntimeContribution\s*=\s*\w+ModuleRuntimeContribution/,
        );
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(10);
  });

  it('package/infra indexes do not re-export short *RuntimeContribution dual types', () => {
    let checked = 0;
    for (const pkg of modules) {
      for (const rel of [
        'src/index.ts',
        'src/server/infrastructure/index.ts',
        'src/server/infrastructure/runtime/index.ts',
      ]) {
        const path = resolve(packagesRoot, pkg, rel);
        if (!existsSync(path)) continue;
        const src = readFileSync(path, 'utf8');
        // Allow *ModuleRuntimeContribution and *RuntimeContributionsInput; forbid short dual alias exports.
        expect(src, path).not.toMatch(
          /type (?!\w+Module)\w+RuntimeContribution\b(?!s)/,
        );
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(20);
  });
});
