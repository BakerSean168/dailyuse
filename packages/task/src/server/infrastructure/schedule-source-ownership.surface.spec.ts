import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * TASK-3101 ownership boundary:
 * Task projection is an identity-scoped neutral ScheduledIntent source.
 * Legacy ScheduleTask may remain only in the execution adapter until TASK-3102.
 */
describe('task schedule source ownership surface', () => {
  const projection = readFileSync(resolve(__dirname, './schedule-projection-source.ts'), 'utf8');
  const execution = readFileSync(resolve(__dirname, './schedule-execution-source.ts'), 'utf8');

  it('projection is identity-scoped and emits neutral SchedulingPort inputs', () => {
    expect(projection).toContain(
      'buildTemplatePlan(templateId: string, identityId: string): Promise<TaskScheduleProjectionPlan>;',
    );
    expect(projection).toContain(
      'buildTemplateOwner(templateId: string, identityId: string): SchedulingOwner;',
    );
    expect(projection).toContain('ScheduledIntent<TaskReminderScheduledPayload>');
    expect(projection).toContain('SchedulingOwner');
    expect(projection).toContain("TASK_REMINDER_HANDLER_KEY = 'task.reminder.fire'");
    expect(projection).toMatch(/findByIdForIdentity\(\s*identityId,\s*templateId,?\s*\)/);
    expect(projection).not.toContain('findById(templateId)');
    expect(projection).toContain('findByTemplateId(');
    expect(projection).toContain('String(templateDTO.identityId)');
    expect(projection).not.toContain('ScheduleTask');
    expect(projection).not.toContain('IScheduleTaskRepository');
    expect(projection).not.toContain('SourceModule');
  });

  it('execution remains identity-scoped while the legacy ScheduleTask adapter waits for TASK-3102', () => {
    expect(execution).toContain('findByIdForIdentity(');
    expect(execution).toContain('String(task.identityId)');
    expect(execution).not.toContain(
      'const instance = await deps.taskInstanceRepository.findById(task.sourceEntityId',
    );
    expect(execution).not.toContain(
      'const template = await deps.taskTemplateRepository.findById(String(instance.templateId)',
    );
  });
});
