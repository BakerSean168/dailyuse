import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1213: formatTimeRange keep-boundary (app-react Intl pair vs app-vue event/all-day).
 * - app-react useScheduleAgenda: (startTime, endTime) → Intl zh-CN hour:minute + " - "
 * - app-vue DayDetailSheet: CalendarEventItem + all-day i18n + padStart HH:mm + en-dash
 * Soft residual 1213: TaskEventActionPanel same vue shape stays separate local.
 * Soft residual 1210: formatDateToInput keep-boundary remains separate.
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

  it('differs from app-vue schedule event/all-day formatTimeRange (no force-merge)', () => {
    expect(vue).toContain('Residual 1213 keep-boundary');
    expect(vue).toMatch(/function formatTimeRange\b/);
    expect(vue).toContain('Soft residual 1213');
    expect(vue).toContain('CalendarEventItem');
    expect(vue).toContain("displayMode === 'all-day'");
    expect(vue).toContain('padStart');
    const body = vue.match(/function formatTimeRange\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('all-day');
    expect(body).toContain('padStart');
    expect(body).toContain('–');
    expect(body).not.toContain('Intl.DateTimeFormat');
    expect(body).not.toContain('zh-CN');
    expect(body).not.toContain('startTime: number, endTime: number');
  });

  it('soft residual 1213 TaskEventActionPanel same vue shape stays separate', () => {
    expect(panel).toContain('Soft residual 1213');
    expect(panel).toMatch(/function formatTimeRange\b/);
    expect(panel).toContain("displayMode === 'all-day'");
    expect(panel).toContain('padStart');
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
    function vueFormatTimeRange(event: {
      displayMode?: string;
      startTime: number;
      endTime: number;
    }): string {
      if (event.displayMode === 'all-day') return 'All day';
      const fmt = (ts: number) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      };
      return `${fmt(event.startTime)} – ${fmt(event.endTime)}`;
    }
    const start = Date.UTC(2024, 0, 2, 9, 0, 0);
    const end = Date.UTC(2024, 0, 2, 10, 30, 0);
    const reactOut = reactFormatTimeRange(start, end);
    expect(typeof reactOut).toBe('string');
    expect(reactOut).toContain(' - ');
    expect(vueFormatTimeRange({ displayMode: 'all-day', startTime: start, endTime: end })).toBe(
      'All day',
    );
    const vueOut = vueFormatTimeRange({ startTime: start, endTime: end });
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
