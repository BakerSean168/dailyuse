import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatLocalHHmm } from './format-local-hhmm';
import { formatCapsuleTime } from '../../modules/schedule/composables/useCalendarView';

/**
 * Residual 1294: multi-site HH:mm padStart dual retired onto formatLocalHHmm sole.
 * Residual 1318: sole body padStart dual retired onto padTwoDigits composition.
 * - sole: packages/app-vue/src/shared/utils/format-local-hhmm.ts
 * - consumers: formatCapsuleTime alias, ReminderCapsulePreview formatTime, UpcomingRemindersWidget formatReminderTime
 * Soft residual 1237: dashboard relative i18n keep-boundary remains (Residual 1309 composes absolute HH:mm only)
 * Does not flip §13.2 checkboxes.
 */
describe('formatLocalHHmm dual retired (residual 1294)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'format-local-hhmm.ts'), 'utf8');
  const schedule = readFileSync(
    resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
    'utf8',
  );
  const capsule = readFileSync(
    resolve(dir, '../../layouts/shell/previews/ReminderCapsulePreview.vue'),
    'utf8',
  );
  const upcoming = readFileSync(
    resolve(dir, '../../modules/reminder/components/widgets/UpcomingRemindersWidget.vue'),
    'utf8',
  );

  it('owns sole formatLocalHHmm body (Residual 1294)', () => {
    expect(sole).toContain('Residual 1294');
    expect(sole).toMatch(/export function formatLocalHHmm\b/);
    const body = sole.match(/export function formatLocalHHmm\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('ms: number');
    expect(body).toContain('padTwoDigits');
    expect(body).not.toContain('padStart');
    expect(body).toContain('getHours');
    expect(body).toContain('getMinutes');
  });

  it('retires formatCapsuleTime / ReminderCapsule / UpcomingReminders dual bodies onto sole', () => {
    expect(schedule).toContain('Residual 1294');
    expect(schedule).toContain('format-local-hhmm');
    const capBody = schedule.match(/export function formatCapsuleTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(capBody).toContain('formatLocalHHmm');
    expect(capBody).not.toContain('padStart');

    expect(capsule).toContain('Residual 1294');
    expect(capsule).toContain('formatLocalHHmm');
    const cBody = capsule.match(/function formatTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(cBody).toContain('formatLocalHHmm');
    expect(cBody).not.toContain('padStart');

    expect(upcoming).toContain('Residual 1294');
    expect(upcoming).toContain('formatLocalHHmm');
    const uBody = upcoming.match(/function formatReminderTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(uBody).toContain("return '--:--'");
    expect(uBody).toContain('formatLocalHHmm');
    expect(uBody).not.toContain('padStart');
  });

  it('soft residual 1237 dashboard relative formatTime keep-boundary stays separate', () => {
    const dashboard = readFileSync(
      resolve(dir, '../../modules/dashboard/components/DashboardActivityTimeline.vue'),
      'utf8',
    );
    expect(dashboard).toMatch(/function formatTime\b/);
    expect(dashboard).toContain('dashboard.time');
    expect(dashboard).toContain("t('dashboard.time.justNow')");
    // Residual 1309: absolute branch may compose formatLocalHHmm; relative i18n stays local.
    const body = dashboard.match(/function formatTime\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('dashboard.time');
    expect(body).not.toContain('date-fns');
  });

  it('runtime: sole and formatCapsuleTime alias agree on local HH:mm', () => {
    const ms = new Date(2026, 6, 24, 9, 5, 0).getTime();
    expect(formatLocalHHmm(ms)).toBe('09:05');
    expect(formatCapsuleTime(ms)).toBe('09:05');
  });

  it('documents residual 1294 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'format-local-hhmm-dual.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1294');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('dual retired');
  });
});
