import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * GOAL-3201 ownership boundary:
 * Goal projection is identity-scoped and emits neutral ScheduledIntent only.
 * Legacy ScheduleTask may remain only in execution until GOAL-3202.
 */
describe('Goal schedule source ownership surface', () => {
  const goalProjection = readFileSync(resolve(__dirname, '../schedule-projection-source.ts'), 'utf8');
  const goalExecution = readFileSync(resolve(__dirname, '../schedule-execution-source.ts'), 'utf8');
  const reminderProjection = readFileSync(
    resolve(__dirname, '../../../../../reminder/src/server/infrastructure/schedule-projection-source.ts'),
    'utf8',
  );
  const reminderExecution = readFileSync(
    resolve(__dirname, '../../../../../reminder/src/server/infrastructure/schedule-execution-source.ts'),
    'utf8',
  );

  it('Goal projection is identity-scoped, Product-Time based, and feature-neutral', () => {
    expect(goalProjection).toContain(
      'buildGoalPlan(goalId: string, identityId: string): Promise<GoalScheduleProjectionPlan>;',
    );
    expect(goalProjection).toContain('ScheduledIntent<GoalReminderScheduledPayload>');
    expect(goalProjection).toContain('SchedulingOwner');
    expect(goalProjection).toContain("GOAL_REMINDER_HANDLER_KEY = 'goal.reminder.fire'");
    expect(goalProjection).toContain('findByIdForIdentity(identityId, goalId, {');
    expect(goalProjection).toContain('time.engine.addDays(');
    expect(goalProjection).not.toContain('findById(goalId, { includeChildren: true })');
    expect(goalProjection).not.toContain('ScheduleTask');
    expect(goalProjection).not.toContain('SourceModule');
    expect(goalProjection).not.toContain('Timezone.Shanghai');
    expect(goalProjection).not.toContain('Asia/Shanghai');
    expect(goalProjection).not.toContain('DAY_MS');
  });

  it('Goal execution remains identity-scoped while legacy execution waits for GOAL-3202', () => {
    expect(goalExecution).toContain('findByIdForIdentity(');
    expect(goalExecution).toContain('String(task.identityId)');
    expect(goalExecution).not.toContain(
      'const goal = await deps.goalRepository.findById(task.sourceEntityId',
    );
  });

  it('Reminder projection/execution ownership is unchanged until ROUTINE-3401', () => {
    expect(reminderProjection).toContain('identityId: string');
    expect(reminderProjection).toContain('findByIdForIdentity(');
    expect(reminderExecution).toContain('findByIdForIdentity(');
    expect(reminderExecution).toContain('String(task.identityId)');
  });
});
