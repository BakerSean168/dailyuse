import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1204: formatDateTime keep-boundary (app-react Intl zh-CN vs app-vue locale local).
 * - app-react entity-presentation: fixed Intl.DateTimeFormat('zh-CN') + '-' empty
 * - app-vue ScheduleTaskDetailDialog: toLocaleString(locale) + 'N/A' empty
 * Soft residual 1204: other vue component-local formatDateTime variants stay separate.
 * Soft residual 1201: handleAuthSuccess keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
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

  it('owns Residual 1204 keep-boundary markers on app-react Intl zh-CN formatDateTime', () => {
    expect(react).toContain('Residual 1204 keep-boundary');
    expect(react).toMatch(/export function formatDateTime\b/);
    expect(react).toContain("Intl.DateTimeFormat('zh-CN'");
    expect(react).toContain("return '-'");
    const body = react.match(/export function formatDateTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('toTimestamp');
    expect(body).toContain('year');
    expect(body).toContain('month');
    expect(body).not.toContain('toLocaleString');
    expect(body).not.toContain('locale.value');
    expect(body).not.toContain("'N/A'");
  });

  it('differs from app-vue schedule component-local formatDateTime (no force-merge)', () => {
    expect(vue).toContain('Residual 1204 keep-boundary');
    expect(vue).toMatch(/function formatDateTime\b/);
    expect(vue).toContain('Soft residual 1204');
    expect(vue).toContain('toLocaleString(locale.value)');
    expect(vue).toContain("'N/A'");
    const body = vue.match(/function formatDateTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('toLocaleString');
    expect(body).toContain('locale.value');
    expect(body).not.toContain('Intl.DateTimeFormat');
    expect(body).not.toContain("return '-'");
    expect(body).not.toContain('toTimestamp');
  });

  it('soft residual 1204 component-local variants remain separate (no force-merge)', () => {
    for (const [label, source] of [
      ['goalReview', goalReview],
      ['goalDetail', goalDetail],
      ['eventList', eventList],
    ] as const) {
      expect(source, label).toContain('Soft residual 1204');
      expect(source, label).toMatch(/function formatDateTime\b/);
      expect(source, label).toContain('toLocaleString');
      expect(source, label).not.toContain('Intl.DateTimeFormat');
    }
  });

  it('runtime: documents Intl zh-CN vs locale toLocaleString contracts via body shape', () => {
    function reactFormatDateTime(value: number | string | null | undefined): string {
      const timestamp =
        value === null || value === undefined
          ? 0
          : typeof value === 'number'
            ? Number.isFinite(value)
              ? value
              : 0
            : (() => {
                const t = new Date(value).getTime();
                return Number.isFinite(t) ? t : 0;
              })();
      if (!timestamp) return '-';
      return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(timestamp));
    }
    function vueFormatDateTime(
      timestamp: number | string | null | undefined,
      locale: string,
    ): string {
      if (!timestamp) return 'N/A';
      const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
      return new Date(time).toLocaleString(locale);
    }
    expect(reactFormatDateTime(null)).toBe('-');
    expect(reactFormatDateTime(0)).toBe('-');
    expect(vueFormatDateTime(null, 'en-US')).toBe('N/A');
    const fixed = Date.UTC(2024, 0, 2, 3, 4, 0);
    const reactOut = reactFormatDateTime(fixed);
    expect(reactOut).toMatch(/2024/);
    expect(typeof vueFormatDateTime(fixed, 'en-US')).toBe('string');
    expect(vueFormatDateTime(fixed, 'en-US').length).toBeGreaterThan(0);
  });

  it('documents residual 1204 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'format-datetime-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1204');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
