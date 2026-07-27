import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveEmptyLabel } from '@dailyuse/time';

/**
 * Residual 1204 (P1/P2): formatDateTime empty catalog keep-boundary.
 * - app-react entity-presentation: session formatProductDateTime + emptyKind('dash')
 * - app-vue ScheduleTaskDetailDialog: formatProductDateTime + emptyKind('na')
 * Soft residual 1204: other vue sites use formatProductDateTime without local wrappers.
 */
describe('formatDateTime keep-boundary (residual 1204)', () => {
  const dir = __dirname;
  const react = readFileSync(
    resolve(dir, '../../../../app-react/src/utils/entity-presentation.ts'),
    'utf8',
  );
  const vue = readFileSync(
    resolve(dir, '../../modules/schedule/components/ScheduleTaskDetailDialog.vue'),
    'utf8',
  );
  const goalReview = readFileSync(
    resolve(dir, '../../modules/goal/views/GoalReviewDetailView.vue'),
    'utf8',
  );
  const goalDetail = readFileSync(
    resolve(dir, '../../modules/goal/views/GoalDetailView.vue'),
    'utf8',
  );
  const eventList = readFileSync(
    resolve(dir, '../../modules/schedule/components/ScheduleEventList.vue'),
    'utf8',
  );

  it('app-react formatDateTime uses session product-time + dash empty', () => {
    expect(react).toContain('Residual 1204');
    expect(react).toMatch(/export function formatEntityDateTime\b/);
    expect(react).toContain("emptyKind('dash')");
    expect(react).toContain('formatProductDateTime');
    expect(react).not.toContain('createTimeFacade');
    expect(react).not.toContain('toLocaleString');
  });

  it('app-vue schedule uses emptyKind na + formatProductDateTime (no local formatDateTime)', () => {
    expect(vue).not.toMatch(/function formatDateTime\b/);
    expect(vue).toContain('formatProductDateTime');
    expect(vue).toContain("emptyKind('na')");
  });

  it('soft residual 1204 sites call formatProductDateTime without local wrappers', () => {
    for (const [label, source] of [
      ['goalReview', goalReview],
      ['goalDetail', goalDetail],
      ['eventList', eventList],
    ] as const) {
      expect(source, label).toContain('formatProductDateTime');
      expect(source, label).not.toMatch(/function formatDateTime\b/);
    }
  });

  it('empty catalog dash vs na remain distinct', () => {
    expect(resolveEmptyLabel('dash')).toBe('-');
    expect(resolveEmptyLabel('na')).toBe('N/A');
    expect(resolveEmptyLabel('dash')).not.toBe(resolveEmptyLabel('na'));
  });
});
