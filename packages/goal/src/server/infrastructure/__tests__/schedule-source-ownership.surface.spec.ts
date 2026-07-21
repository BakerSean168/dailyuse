import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Goal/reminder schedule source ownership (stage-6 residual 130):
 * projection with identity and execution must load aggregates via
 * findByIdForIdentity, not bare primary keys alone.
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

  it('goal projection prefers findByIdForIdentity when identity present', () => {
    expect(goalProjection).toContain('findByIdForIdentity(identityId, goalId');
    expect(goalProjection).toContain('findById(goalId, { includeChildren: true })');
  });

  it('goal execution loads via findByIdForIdentity(task.identityId)', () => {
    expect(goalExecution).toContain('findByIdForIdentity(');
    expect(goalExecution).toContain('String(task.identityId)');
    expect(goalExecution).not.toContain(
      'const goal = await deps.goalRepository.findById(task.sourceEntityId',
    );
  });

  it('reminder projection prefers findByIdForIdentity when identity present', () => {
    expect(reminderProjection).toContain('findByIdForIdentity(identityId, templateId');
    expect(reminderProjection).toContain('findById(templateId, {');
  });

  it('reminder execution loads via findByIdForIdentity(task.identityId)', () => {
    expect(reminderExecution).toContain('findByIdForIdentity(');
    expect(reminderExecution).toContain('String(task.identityId)');
    expect(reminderExecution).not.toContain(
      'const reminder = await deps.reminderTemplateRepository.findById(task.sourceEntityId',
    );
  });
});
