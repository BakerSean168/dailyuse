import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 739: task goal-binding / reminder-config dual bodies retired.
 * TaskGoalBindingDTO / TaskReminderConfigDTO reuse *Schema only.
 * (TaskTimeConfig left alone: DomainDate vs TransferDate shape mismatch.)
 */
describe('task goal-binding/reminder dual retired (residual 739)', () => {
  const apiDir = __dirname;
  const binding = readFileSync(
    resolve(apiDir, '../value-objects/task-goal-binding.ts'),
    'utf8',
  );
  const reminder = readFileSync(
    resolve(apiDir, '../value-objects/task-reminder-config.ts'),
    'utf8',
  );
  const templateDto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');

  it('exports binding/reminder schemas as sole shapes from VO modules', () => {
    expect(binding).toContain('Residual 739');
    expect(binding).toContain('export const TaskGoalBindingSchema = z.object({');
    expect(reminder).toContain('Residual 739');
    expect(reminder).toContain('export const TaskReminderConfigSchema = z');
  });

  it('semantic DTOs are z.infer aliases without interface dual bodies', () => {
    expect(binding).toContain(
      'export type TaskGoalBindingDTO = z.infer<typeof TaskGoalBindingSchema>',
    );
    expect(binding).not.toMatch(/export interface TaskGoalBindingDTO\b/);
    expect(reminder).toContain(
      'export type TaskReminderConfigDTO = z.infer<typeof TaskReminderConfigSchema>',
    );
    expect(reminder).not.toMatch(/export interface TaskReminderConfigDTO\b/);
  });

  it('task-template.dto re-exports VO-owned schemas (no local dual bodies)', () => {
    expect(templateDto).toContain('Residual 739');
    expect(templateDto).toContain("from '../value-objects/task-goal-binding'");
    expect(templateDto).toContain("from '../value-objects/task-reminder-config'");
    expect(templateDto).toContain(
      'export { TaskReminderConfigSchema, TaskGoalBindingSchema }',
    );
    expect(templateDto).not.toMatch(
      /const TaskGoalBindingSchema = z\.object\(\{/,
    );
    expect(templateDto).not.toMatch(
      /const TaskReminderConfigSchema(?::[^=]+)? = z/,
    );
    expect(templateDto).toContain('goalBinding: TaskGoalBindingSchema');
    expect(templateDto).toContain('reminderConfig: TaskReminderConfigSchema');
    expect(templateDto).toContain(
      'export type BindToGoalReq = z.infer<typeof TaskGoalBindingSchema>',
    );
  });
});
