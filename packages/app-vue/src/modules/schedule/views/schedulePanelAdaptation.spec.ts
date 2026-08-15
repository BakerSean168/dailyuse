import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const scheduleSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), 'ScheduleCalendarView.vue'),
  'utf8',
);
const daySource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../components/DayViewCalendar.vue'),
  'utf8',
);
const weekSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../components/WeekViewCalendar.vue'),
  'utf8',
);
const monthSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../components/MonthViewCalendar.vue'),
  'utf8',
);

describe('Schedule single-page architecture', () => {
  it('keeps one calendar toolbar and never changes views based on panel width', () => {
    expect(scheduleSource).toContain('data-testid="schedule-page-toolbar"');
    expect(scheduleSource).toContain('data-primary-action="create-schedule"');
    expect(scheduleSource.match(/data-primary-action=/g)).toHaveLength(1);
    expect(scheduleSource).toContain(':aria-selected="activeView === tab.value"');
    expect(scheduleSource).not.toContain('usePanelWidth');
    expect(scheduleSource).not.toContain('isNarrow');
    expect(scheduleSource).not.toContain('effectiveView');
    expect(scheduleSource).not.toContain('schedule-narrow-day-hint');
  });

  it('owns period navigation in the page toolbar instead of child calendar headers', () => {
    expect(scheduleSource).toContain('data-testid="schedule-period-navigation"');
    expect(daySource).not.toContain('previousDay');
    expect(weekSource).not.toContain('previousWeek');
    expect(monthSource).not.toContain('previousMonth');
    expect(daySource).not.toContain('<h3');
    expect(weekSource).not.toContain('<h3');
    expect(monthSource).not.toContain('<h3');
  });
});
