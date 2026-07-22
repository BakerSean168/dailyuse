import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Goal/reminder schedule source ownership (stage-6 residual 130/168):
 * projection requires identityId and loads only via findByIdForIdentity;
 * execution must load aggregates via findByIdForIdentity, not bare PKs.
 */
describe('schedule source ownership surface', () => {
  const goalProjection = readFileSync(
    resolve(__dirname, '../schedule-projection-source.ts'),
    'utf8',
  );
  const goalExecution = readFileSync(
    resolve(__dirname, '../schedule-execution-source.ts'),
    'utf8',
  );
  const reminderProjection = readFileSync(
    resolve(
      __dirname,
      '../../../../../reminder/src/server/infrastructure/schedule-projection-source.ts',
    ),
    'utf8',
  );
  const reminderExecution = readFileSync(
    resolve(
      __dirname,
      '../../../../../reminder/src/server/infrastructure/schedule-execution-source.ts',
    ),
    'utf8',
  );

  it('goal projection requires identityId and never bare findById (residual 168)', () => {
    expect(goalProjection).toContain(
      'buildGoalPlan(goalId: string, identityId: string): Promise<GoalScheduleProjectionPlan>;',
    );
    expect(goalProjection).toContain('readonly identityId: string;');
    expect(goalProjection).toContain(
      'findByIdForIdentity(identityId, goalId, {\n        includeChildren: true,\n      })',
    );
    expect(goalProjection).not.toContain('findById(goalId, { includeChildren: true })');
  });

  it('goal execution loads via findByIdForIdentity(task.identityId)', () => {
    expect(goalExecution).toContain('findByIdForIdentity(');
    expect(goalExecution).toContain('String(task.identityId)');
    expect(goalExecution).not.toContain(
      'const goal = await deps.goalRepository.findById(task.sourceEntityId',
    );
  });

  it('reminder projection requires identityId and never bare findById (residual 168)', () => {
    expect(reminderProjection).toContain(
      'identityId: string,\n  ): Promise<ReminderScheduleProjectionPlan>;',
    );
    expect(reminderProjection).toContain('readonly identityId: string;');
    expect(reminderProjection).toContain(
      'findByIdForIdentity(\n        identityId,\n        templateId,',
    );
    expect(reminderProjection).not.toContain('findById(templateId, {');
  });

  it('reminder execution loads via findByIdForIdentity(task.identityId)', () => {
    expect(reminderExecution).toContain('findByIdForIdentity(');
    expect(reminderExecution).toContain('String(task.identityId)');
    expect(reminderExecution).not.toContain(
      'const reminder = await deps.reminderTemplateRepository.findById(task.sourceEntityId',
    );
  });
});
