import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 833: ActiveTimeConfigDTO / ReminderTemplateClientDTO / ScheduleExecutionClientDTO
 * dual bodies retired. Sole *Schema + z.infer; ActiveTime transport is activatedAt (not startDate/endDate).
 */
describe('reminder template activeTime + schedule execution duals retired (residual 833)', () => {
  const reminderApi = __dirname;
  const scheduleApi = resolve(reminderApi, '../../schedule/api');
  const activeTimeVo = readFileSync(
    resolve(reminderApi, '../value-objects/active-time-config.ts'),
    'utf8',
  );
  const template = readFileSync(
    resolve(reminderApi, '../aggregates/reminder-template-client.ts'),
    'utf8',
  );
  const execution = readFileSync(
    resolve(reminderApi, '../../schedule/entities/schedule-execution-client.ts'),
    'utf8',
  );
  const reminderSchemas = readFileSync(resolve(reminderApi, 'response-schemas.ts'), 'utf8');
  const scheduleSchemas = readFileSync(resolve(scheduleApi, 'response-schemas.ts'), 'utf8');

  it('owns ActiveTimeConfigDTO as z.infer(activatedAt); response reuses VO schema', () => {
    expect(activeTimeVo).toContain('Residual 833');
    expect(activeTimeVo).toContain('export const ActiveTimeConfigSchema = z.object({');
    expect(activeTimeVo).toContain('activatedAt: z.number()');
    expect(activeTimeVo).toContain(
      'export type ActiveTimeConfigDTO = z.infer<typeof ActiveTimeConfigSchema>',
    );
    expect(activeTimeVo).not.toMatch(/export interface ActiveTimeConfigDTO\b/);
    expect(activeTimeVo).not.toMatch(/startDate\s*:/);
    expect(activeTimeVo).not.toMatch(/endDate\s*:/);
    expect(reminderSchemas).toContain('Residual 833');
    expect(reminderSchemas).toContain("from '../value-objects/active-time-config'");
    expect(reminderSchemas).toContain('activeTime: ActiveTimeConfigSchema');
    expect(reminderSchemas).not.toMatch(/const ActiveTimeConfigSchema = z\.object/);
    expect(reminderSchemas).not.toMatch(/startDate: z\.number\(\)/);
    expect(reminderSchemas).not.toMatch(/endDate: z\.number\(\)/);
  });

  it('owns ReminderTemplateClientDTO as z.infer of ReminderTemplateResponseSchema', () => {
    expect(template).toContain('Residual 833');
    expect(template).toContain(
      'export type ReminderTemplateClientDTO = z.infer<typeof ReminderTemplateResponseSchema>',
    );
    expect(template).not.toMatch(/export interface ReminderTemplateClientDTO\b/);
    expect(reminderSchemas).toContain(
      'export const ReminderTemplateResponseSchema = z.object({',
    );
    expect(reminderSchemas).toContain('history: z.array(z.lazy(() => ReminderHistoryResponseSchema)).nullable()');
  });

  it('owns ScheduleExecutionClientDTO as z.infer of exported ScheduleExecutionResponseSchema', () => {
    expect(execution).toContain('Residual 833');
    expect(execution).toContain(
      'export type ScheduleExecutionClientDTO = z.infer<typeof ScheduleExecutionResponseSchema>',
    );
    expect(execution).not.toMatch(/export interface ScheduleExecutionClientDTO\b/);
    expect(scheduleSchemas).toContain('Residual 833');
    expect(scheduleSchemas).toContain(
      'export const ScheduleExecutionResponseSchema = z.object({',
    );
    expect(scheduleSchemas).not.toMatch(
      /const ScheduleExecutionResponseSchema:\s*z\.ZodType</,
    );
    expect(scheduleSchemas).toContain(
      'executions: z.array(ScheduleExecutionResponseSchema).nullable()',
    );
  });
});
