import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatCalendarEventTimeRange } from './format-calendar-event-time-range';

/**
 * Residual 1213: formatTimeRange keep-boundary (app-react Intl pair vs app-vue event/all-day).
 * - app-react useScheduleAgenda: (startTime, endTime) → Intl zh-CN hour:minute + " - "
 * - app-vue event/all-day shape lives in formatCalendarEventTimeRange sole (Residual 1273 dual-retired)
 * Soft residual 1213 / Residual 1273: DayDetailSheet + TaskEventActionPanel dual-retired onto sole.
 * Soft residual 1210: formatDateToInput keep-boundary remains separate.
 * Residual 1303: vue sole inner HH:mm dual retired onto formatLocalHHmm (en-dash keeps separate from react " - ").
 * Does not flip §13.2 checkboxes.
 */
describe('formatTimeRange keep-boundary (residual 1213)', () => {
  const dir = __dirname;
  const react = readFileSync(
    resolve(dir, '../../../../app-react/src/hooks/useScheduleAgenda.ts'),
    'utf8',
  );
  const vue = readFileSync(
    resolve(dir, '../../modules/schedule/components/DayDetailSheet.vue'),
    'utf8',
  );
  const panel = readFileSync(
    resolve(dir, '../../modules/schedule/components/TaskEventActionPanel.vue'),
    'utf8',
  );
  const sole = readFileSync(resolve(dir, 'format-calendar-event-time-range.ts'), 'utf8');

  it('owns Residual 1213 keep-boundary markers on app-react Intl zh-CN formatTimeRange', () => {
    expect(react).toContain('Residual 1213 keep-boundary');
    expect(react).toMatch(/function formatTimeRange\b/);
    expect(react).toContain('startTime: number, endTime: number');
    expect(react).toContain("Intl.DateTimeFormat('zh-CN'");
    const body = react.match(/function formatTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('hour');
    expect(body).toContain('minute');
    expect(body).toContain(' - ');
    expect(body).not.toContain('all-day');
    expect(body).not.toContain('CalendarEventItem');
    expect(body).not.toContain('padStart');
  });

  it('differs from app-vue event/all-day sole shape (no force-merge)', () => {
    expect(vue).toContain('Residual 1213 keep-boundary');
    expect(vue).toContain('Soft residual 1213');
    expect(vue).toContain('CalendarEventItem');
    expect(sole).toContain('Residual 1273');
    expect(sole).toContain('Residual 1303');
    expect(sole).toContain("displayMode === 'all-day'");
    expect(sole).toContain('formatLocalHHmm');
    expect(sole).not.toContain('padStart');
    expect(sole).toContain('–');
    const body = sole.match(/export function formatCalendarEventTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('all-day');
    expect(body).toContain('formatLocalHHmm');
    expect(body).not.toContain('padStart');
    expect(body).toContain('–');
    expect(body).not.toContain('Intl.DateTimeFormat');
    expect(body).not.toContain('zh-CN');
    expect(body).not.toContain('startTime: number, endTime: number');
  });

  it('Residual 1273 vue DayDetail/Panel dual retired onto formatCalendarEventTimeRange sole', () => {
    expect(vue).toContain('Residual 1273');
    expect(vue).toContain('format-calendar-event-time-range');
    expect(vue).toContain('formatCalendarEventTimeRange');
    expect(vue).toMatch(/function formatTimeRange\b/);
    const vueBody = vue.match(/function formatTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(vueBody).toContain('formatCalendarEventTimeRange');
    expect(vueBody).not.toContain('padStart');

    expect(panel).toContain('Residual 1273');
    expect(panel).toContain('format-calendar-event-time-range');
    expect(panel).toContain('formatCalendarEventTimeRange');
    const panelBody = panel.match(/function formatTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(panelBody).toContain('formatCalendarEventTimeRange');
    expect(panelBody).not.toContain('padStart');
    expect(panel).not.toContain('Intl.DateTimeFormat');
  });

  it('runtime: documents Intl pair vs event/all-day contracts via body shape', () => {
    function reactFormatTimeRange(startTime: number, endTime: number): string {
      const formatter = new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${formatter.format(new Date(startTime))} - ${formatter.format(new Date(endTime))}`;
    }
    const start = Date.UTC(2024, 0, 2, 9, 0, 0);
    const end = Date.UTC(2024, 0, 2, 10, 30, 0);
    const reactOut = reactFormatTimeRange(start, end);
    expect(typeof reactOut).toBe('string');
    expect(reactOut).toContain(' - ');
    expect(
      formatCalendarEventTimeRange(
        { displayMode: 'all-day', startTime: start, endTime: end },
        'All day',
      ),
    ).toBe('All day');
    const vueOut = formatCalendarEventTimeRange({ startTime: start, endTime: end }, 'All day');
    expect(vueOut).toContain('–');
    expect(vueOut).not.toContain(' - ');
  });

  it('documents residual 1213 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-time-range-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1213');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
