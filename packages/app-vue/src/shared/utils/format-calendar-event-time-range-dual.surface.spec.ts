import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatCalendarEventTimeRange } from './format-calendar-event-time-range';

/**
 * Residual 1273: formatCalendarEventTimeRange dual retired onto app-vue shared sole.
 * - sole: packages/app-vue/src/shared/utils/format-calendar-event-time-range.ts
 * - consumers: DayDetailSheet + TaskEventActionPanel (was identical local formatTimeRange)
 * Soft residual 1213: app-react useScheduleAgenda Intl zh-CN pair keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('formatCalendarEventTimeRange dual retired (residual 1273)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'format-calendar-event-time-range.ts'), 'utf8');
  const day = readFileSync(
    resolve(dir, '../../modules/schedule/components/DayDetailSheet.vue'),
    'utf8',
  );
  const panel = readFileSync(
    resolve(dir, '../../modules/schedule/components/TaskEventActionPanel.vue'),
    'utf8',
  );
  const react = readFileSync(
    resolve(dir, '../../../../app-react/src/hooks/useScheduleAgenda.ts'),
    'utf8',
  );

  it('owns sole formatCalendarEventTimeRange body (Residual 1273)', () => {
    expect(sole).toContain('Residual 1273');
    expect(sole).toMatch(/export function formatCalendarEventTimeRange\b/);
    expect(sole).toContain("displayMode === 'all-day'");
    expect(sole).toContain('padStart');
    expect(sole).toContain('–');
    const body = sole.match(/export function formatCalendarEventTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('allDayLabel');
    expect(body).not.toContain('Intl.DateTimeFormat');
    expect(body).not.toContain('zh-CN');
  });

  it('retires DayDetail/Panel dual bodies onto shared sole', () => {
    for (const [label, source] of [
      ['day', day],
      ['panel', panel],
    ] as const) {
      expect(source, label).toContain('Residual 1273');
      expect(source, label).toContain('format-calendar-event-time-range');
      expect(source, label).toContain('formatCalendarEventTimeRange');
      expect(source, label).toMatch(/function formatTimeRange\b/);
      const body = source.match(/function formatTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
      expect(body, label).toContain('formatCalendarEventTimeRange');
      expect(body, label).not.toContain('padStart');
      expect(body, label).not.toContain('instanceof Date');
    }
  });

  it('soft residual 1213 app-react Intl pair keep-boundary stays separate', () => {
    expect(react).toContain('Residual 1213 keep-boundary');
    expect(react).toMatch(/function formatTimeRange\b/);
    expect(react).toContain("Intl.DateTimeFormat('zh-CN'");
    expect(react).not.toContain('format-calendar-event-time-range');
    expect(react).not.toContain('formatCalendarEventTimeRange');
  });

  it('runtime: sole all-day label and en-dash range', () => {
    const start = new Date(2026, 6, 24, 9, 5, 0).getTime();
    const end = new Date(2026, 6, 24, 10, 30, 0).getTime();
    expect(
      formatCalendarEventTimeRange(
        { displayMode: 'all-day', startTime: start, endTime: end },
        '整天',
      ),
    ).toBe('整天');
    expect(formatCalendarEventTimeRange({ startTime: start, endTime: end }, '整天')).toBe(
      '09:05 – 10:30',
    );
  });

  it('documents residual 1273 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-calendar-event-time-range-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1273');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
