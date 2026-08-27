import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** PLAN-4304 retirement lock: FullCalendar owns Day/Week/Month geometry. */
describe('Planner calendar layout retirement (PLAN-4304)', () => {
  const dir = __dirname;
  const planner = readFileSync(
    resolve(dir, '../../modules/schedule/planner/PlannerCalendar.vue'),
    'utf8',
  );
  const view = readFileSync(
    resolve(dir, '../../modules/schedule/views/ScheduleCalendarView.vue'),
    'utf8',
  );
  const calendarView = readFileSync(
    resolve(dir, '../../modules/schedule/composables/useCalendarView.ts'),
    'utf8',
  );

  it('delegates the three production layouts to Standard FullCalendar plugins', () => {
    expect(planner).toContain("dayGridPlugin");
    expect(planner).toContain("timeGridPlugin");
    expect(planner).toContain("day: 'timeGridDay'");
    expect(planner).toContain("week: 'timeGridWeek'");
    expect(planner).toContain("month: 'dayGridMonth'");
    expect(planner).toContain('dayMaxEvents: 3');
  });

  it('does not reintroduce custom event geometry/date-grid arithmetic beside FullCalendar', () => {
    for (const source of [planner, view, calendarView]) {
      expect(source).not.toContain('function getEventStyle');
      expect(source).not.toContain('24 * 64');
      expect(source).not.toContain('grid-rows-6');
      expect(source).not.toContain('calendarEventBgClass');
    }
    expect(view).not.toContain('resolveCalendarWindow');
    expect(view).not.toContain('getWeekStart');
  });
});
