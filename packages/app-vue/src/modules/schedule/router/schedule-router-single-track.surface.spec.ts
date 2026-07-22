import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 230: schedule router has a single calendar entry.
 * No week/dashboard dual-track redirect routes for backward compatibility.
 */
describe('schedule router single-track surface', () => {
  const router = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');
  const weekE2e = readFileSync(
    resolve(__dirname, '../../../../../../apps/web/e2e/schedule/schedule-week-view.spec.ts'),
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

  it('schedule e2e lands on unified calendar path', () => {
    expect(weekE2e).toContain('/schedule/calendar');
    expect(weekE2e).not.toContain('/schedule/week');
  });
});
