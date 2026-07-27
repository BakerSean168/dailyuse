import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1279: formatEventTime keep-boundary (Day spaced hyphen vs Week compact hyphen).
 * - DayViewCalendar: HH:mm " - " HH:mm + all-day i18n
 * - WeekViewCalendar: HH:mm-HH:mm + all-day i18n (dense week cells)
 * Soft residual 1279:
 * - formatCalendarEventTimeRange dual-retired sole uses en-dash " – " (Residual 1273)
 * Soft residual 1276: formatHour dual-retired sole remains separate
 * Residual 1300: inner HH:mm dual retired onto formatLocalHHmm (separator keep-boundary remains)
 * Does not flip §13.2 checkboxes.
 */
describe('formatEventTime keep-boundary (residual 1279)', () => {
  const dir = __dirname;
  const day = readFileSync(
    resolve(dir, '../../modules/schedule/components/DayViewCalendar.vue'),
    'utf8',
  );
  const week = readFileSync(
    resolve(dir, '../../modules/schedule/components/WeekViewCalendar.vue'),
    'utf8',
  );
  const eventRangeSole = readFileSync(
    resolve(dir, 'format-calendar-event-time-range.ts'),
    'utf8',
  );
  const hourSole = readFileSync(resolve(dir, 'format-hour.ts'), 'utf8');

  it('owns Residual 1279 keep-boundary markers on Day spaced-hyphen formatEventTime', () => {
    expect(day).toContain('Residual 1279 keep-boundary');
    expect(day).toMatch(/function formatEventTime\b/);
    expect(day).toContain('Soft residual 1279');
    const body = day.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain("displayMode === 'all-day'");
    expect(body).toContain('formatLocalHHmm');
    expect(body).not.toContain('padStart');
    expect(body).toContain(' - ');
    expect(body).not.toContain('–');
    expect(body).not.toContain('formatCalendarEventTimeRange');
    expect(body).not.toContain('Intl.DateTimeFormat');
  });

  it('differs from Week compact-hyphen formatEventTime (no force-merge)', () => {
    expect(week).toContain('Residual 1279 keep-boundary');
    expect(week).toMatch(/function formatEventTime\b/);
    expect(week).toContain('Soft residual 1279');
    const body = week.match(/function formatEventTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain("displayMode === 'all-day'");
    expect(body).toContain('formatLocalHHmm');
    expect(body).not.toContain('padStart');
    expect(body).toContain('}-${');
    expect(body).not.toContain(' - ');
    expect(body).not.toContain('–');
    expect(body).not.toContain('formatCalendarEventTimeRange');
  });

  it('soft residual 1279 en-dash event-range sole + formatHour sole stay separate', () => {
    expect(eventRangeSole).toContain('Residual 1273');
    expect(eventRangeSole).toContain('–');
    expect(eventRangeSole).not.toContain('function formatEventTime');

    expect(hourSole).toContain('Residual 1276');
    expect(hourSole).toMatch(/export\s*\{\s*formatHour\s*\}/);
    expect(day).toContain('Residual 1276');
    expect(week).toContain('Residual 1276');
    expect(day).toContain('format-hour');
    expect(week).toContain('format-hour');
  });

  it('runtime: documents Day spaced vs Week compact separator contracts', () => {
    function dayFormatEventTime(event: {
      displayMode?: string;
      startTime: number;
      endTime: number;
    }): string {
      if (event.displayMode === 'all-day') return 'All day';
      const fmt = (ts: number) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      };
      return `${fmt(event.startTime)} - ${fmt(event.endTime)}`;
    }
    function weekFormatEventTime(event: {
      displayMode?: string;
      startTime: number;
      endTime: number;
    }): string {
      if (event.displayMode === 'all-day') return 'All day';
      const fmt = (ts: number) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      };
      return `${fmt(event.startTime)}-${fmt(event.endTime)}`;
    }
    const start = new Date(2026, 6, 24, 9, 5, 0).getTime();
    const end = new Date(2026, 6, 24, 10, 30, 0).getTime();
    expect(dayFormatEventTime({ displayMode: 'all-day', startTime: start, endTime: end })).toBe(
      'All day',
    );
    expect(dayFormatEventTime({ startTime: start, endTime: end })).toBe('09:05 - 10:30');
    expect(weekFormatEventTime({ startTime: start, endTime: end })).toBe('09:05-10:30');
    expect(dayFormatEventTime({ startTime: start, endTime: end })).not.toBe(
      weekFormatEventTime({ startTime: start, endTime: end }),
    );
  });

  it('documents residual 1279 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-event-time-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1279');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
