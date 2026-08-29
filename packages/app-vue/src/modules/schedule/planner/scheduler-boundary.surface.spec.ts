import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectionSource = readFileSync(resolve(__dirname, 'calendar-event-projection.ts'), 'utf8');
const plannerContract = readFileSync(
  resolve(__dirname, '../../../../../contracts/src/modules/schedule/planner.ts'),
  'utf8',
);

describe('Planner / Scheduler ownership boundary (PLAN-4302)', () => {
  it('accepts only owner-domain read facts and never imports/exposes raw Scheduler invocation shapes', () => {
    expect(projectionSource).not.toMatch(
      /import[^;]*(?:ScheduleTaskClientDTO|ScheduledInvocationContext|SchedulingPort)/s,
    );
    expect(projectionSource).not.toMatch(
      /readonly\s+(?:scheduleTasks|scheduledInvocations|handlerKey|leaseExpiresAt|deadLetter\w*)\s*:/,
    );
    expect(plannerContract).not.toMatch(
      /readonly\s+(?:scheduleTasks|scheduledInvocations|handlerKey|leaseExpiresAt|deadLetter\w*)\s*:/,
    );
    expect(projectionSource).toContain('calendarEntries');
    expect(projectionSource).toContain('taskOccurrences');
    expect(projectionSource).toContain('goals');
    expect(projectionSource).toContain('routineOccurrences');
  });
});
