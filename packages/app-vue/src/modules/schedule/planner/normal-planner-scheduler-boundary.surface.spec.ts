import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const plannerView = readFileSync(resolve(__dirname, '../views/ScheduleCalendarView.vue'), 'utf8');
const calendarView = readFileSync(resolve(__dirname, '../composables/useCalendarView.ts'), 'utf8');

describe('normal Planner surface excludes Scheduler operations rows (PLAN-4302)', () => {
  it('does not mount or expose raw ScheduleTask diagnostics from the normal Planner route', () => {
    expect(plannerView).not.toContain('DevScheduleDebugPanel');
    expect(plannerView).not.toContain('scheduleTasks');
    expect(calendarView).not.toContain('scheduleTasks:');
    expect(calendarView).not.toContain('ScheduleTaskClientDTO');
    expect(calendarView).toContain('projections');
  });
});
