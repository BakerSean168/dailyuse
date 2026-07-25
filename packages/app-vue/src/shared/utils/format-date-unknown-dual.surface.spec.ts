import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1264: formatDateUnknown dual retired onto app-react shared sole.
 * - sole: packages/app-react/src/utils/format-date-unknown.ts
 * - consumers: NotificationDetailScreen + NotificationCard (was local formatDate datetime + 'Unknown')
 * Soft residual 1264 / 1261 / 1240:
 * - formatDateNotSet dual-retired sole remains separate (date-only + 'Not set')
 * - TaskDetailScreen: toLocaleString + 'Not set'
 * - GoalCompareScreen: toLocaleDateString + '-' (Residual 1240 keep-boundary)
 * Does not flip §13.2 checkboxes.
 */
describe('formatDateUnknown dual retired (residual 1264)', () => {
  const dir = __dirname;
  const reactUtils = resolve(dir, '../../../../app-react/src/utils');
  const reactScreens = resolve(dir, '../../../../app-react/src/screens');
  const reactComponents = resolve(dir, '../../../../app-react/src/components');
  const sole = readFileSync(resolve(reactUtils, 'format-date-unknown.ts'), 'utf8');
  const detail = readFileSync(resolve(reactScreens, 'NotificationDetailScreen.tsx'), 'utf8');
  const card = readFileSync(resolve(reactComponents, 'NotificationCard.tsx'), 'utf8');
  const taskDetail = readFileSync(resolve(reactScreens, 'TaskDetailScreen.tsx'), 'utf8');
  const notSetSole = readFileSync(resolve(reactUtils, 'format-date-not-set.ts'), 'utf8');

  it('owns sole formatDateUnknown body (Residual 1264)', () => {
    expect(sole).toContain('Residual 1264');
    expect(sole).toMatch(/export function formatDateUnknown\b/);
    expect(sole).toContain("'Unknown'");
    expect(sole).toContain('toLocaleString()');
    const body = sole.match(/export function formatDateUnknown\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('number | null | undefined');
    expect(body).not.toContain('toLocaleDateString()');
    expect(body).not.toContain("'Not set'");
    expect(body).not.toContain("return '-'");
  });

  it('retires Notification dual bodies onto shared sole', () => {
    for (const [label, source] of [
      ['detail', detail],
      ['card', card],
    ] as const) {
      expect(source, label).toContain('Residual 1264');
      expect(source, label).toContain('format-date-unknown');
      expect(source, label).toContain('formatDateUnknown');
      expect(source, label).not.toMatch(/function formatDate\b/);
      expect(source, label).not.toMatch(
        /function formatDate\b[\s\S]*?'Unknown'[\s\S]*?toLocaleString/,
      );
    }
  });

  it('soft residual 1264 formatDateNotSet sole + task Not set stay separate', () => {
    expect(notSetSole).toContain('Residual 1261');
    expect(notSetSole).toMatch(/export function formatDateNotSet\b/);
    expect(notSetSole).toContain("'Not set'");
    expect(notSetSole).toContain('toLocaleDateString()');
    const notSetBody = notSetSole.match(/export function formatDateNotSet\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(notSetBody).toContain("'Not set'");
    expect(notSetBody).not.toContain("'Unknown'");

    expect(taskDetail).toContain('Soft residual 1261');
    const taskBody = taskDetail.match(/function formatDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(taskBody).toContain("'Not set'");
    expect(taskBody).toContain('toLocaleString()');
    expect(taskDetail).not.toContain('format-date-unknown');
  });

  it('documents residual 1264 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'format-date-unknown-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1264');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
