import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calendarEventSourceLabel } from '../../modules/schedule/composables/useCalendarView';

/**
 * Residual 1291: sourceLabel dual retired onto schedule calendarEventSourceLabel sole.
 * - sole: packages/app-vue/src/modules/schedule/composables/useCalendarView.ts#calendarEventSourceLabel
 * - consumers: DayDetailSheet + EventDetailSheet
 * Soft residual 1291: formatCapsuleTime / multi-site HH:mm padStart keep-boundary remains separate
 * Soft residual 1288: Month eventClass + getEventStyle Day/Week layout keep-boundaries remain separate
 * Does not flip §13.2 checkboxes.
 */
describe('calendarEventSourceLabel dual retired (residual 1291)', () => {
  const dir = __dirname;
  const sole = readFileSync(
    resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
    'utf8',
  );
  const dayDetail = readFileSync(
    resolve(dir, '../../modules/schedule/components/DayDetailSheet.vue'),
    'utf8',
  );
  const eventDetail = readFileSync(
    resolve(dir, '../../modules/schedule/components/EventDetailSheet.vue'),
    'utf8',
  );

  it('owns sole calendarEventSourceLabel body (Residual 1291)', () => {
    expect(sole).toContain('Residual 1291');
    expect(sole).toMatch(/export function calendarEventSourceLabel\b/);
    const body = sole.match(/export function calendarEventSourceLabel\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('schedule.source.schedule');
    expect(body).toContain('schedule.source.goal');
    expect(body).toContain('schedule.source.task');
    expect(body).toContain('translate(keys[source])');
  });

  it('retires DayDetail + EventDetail sourceLabel dual bodies onto schedule sole', () => {
    for (const [label, source] of [
      ['dayDetail', dayDetail],
      ['eventDetail', eventDetail],
    ] as const) {
      expect(source, label).toContain('Residual 1291');
      expect(source, label).toContain('calendarEventSourceLabel');
      expect(source, label).not.toMatch(/function sourceLabel\b/);
      expect(source, label).not.toMatch(/function calendarEventSourceLabel\b/);
      expect(source, label).not.toMatch(
        /function sourceLabel\b[\s\S]*?schedule\.source\.schedule/,
      );
    }
  });

  it('soft residual 1291 formatCapsuleTime HH:mm sole stays separate from source labels', () => {
    expect(sole).toMatch(/export function formatCapsuleTime\b/);
    expect(sole).toContain("padStart(2, '0')");
    const cap = sole.match(/export function formatCapsuleTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(cap).toContain('getHours');
    expect(cap).not.toContain('schedule.source');
  });

  it('runtime: sole maps source keys through translate', () => {
    const translate = (key: string) => `L:${key}`;
    expect(calendarEventSourceLabel('schedule', translate)).toBe('L:schedule.source.schedule');
    expect(calendarEventSourceLabel('goal', translate)).toBe('L:schedule.source.goal');
    expect(calendarEventSourceLabel('task', translate)).toBe('L:schedule.source.task');
  });

  it('documents residual 1291 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'calendar-event-source-label-dual.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1291');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
