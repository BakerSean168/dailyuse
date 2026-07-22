import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 230/232: schedule router has a single calendar entry.
 * No week/dashboard dual-track redirect routes; no dual week-view E2E.
 */
describe('schedule router single-track surface', () => {
  const router = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');
  const repoRoot = resolve(__dirname, '../../../../../../');
  const weekE2e = resolve(repoRoot, 'apps/web/e2e/schedule/schedule-week-view.spec.ts');
  const calendarE2e = resolve(repoRoot, 'apps/web/e2e/schedule/schedule-calendar.spec.ts');
  const scheduleFilesIndex = readFileSync(
    resolve(repoRoot, 'docs/product/module-index/schedule-files.md'),
    'utf8',
  );

  it('registers only calendar child route (no week/dashboard dual redirects)', () => {
    expect(router).toContain("path: 'calendar'");
    expect(router).toContain("name: 'ScheduleCalendar'");
    expect(router).not.toContain("path: 'week'");
    expect(router).not.toContain("path: 'dashboard'");
    expect(router).not.toContain('ScheduleWeekView');
    expect(router).not.toContain('ScheduleDashboard');
    expect(router).not.toContain('backward compatibility');
  });

  it('docs and e2e follow single calendar entry (no dual week route surface)', () => {
    expect(existsSync(calendarE2e)).toBe(true);
    expect(existsSync(weekE2e)).toBe(false);
    expect(scheduleFilesIndex).toContain('ScheduleCalendarView.vue');
    expect(scheduleFilesIndex).toContain('/schedule/calendar');
    expect(scheduleFilesIndex).not.toContain('ScheduleWeekView.vue');
    expect(scheduleFilesIndex).not.toContain('ScheduleDashboardView.vue');
    expect(scheduleFilesIndex).not.toContain('重定向到主视图');
  });
});
