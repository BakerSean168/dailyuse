import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 741: goal reminder-config dual bodies retired.
 * GoalReminderConfigDTO / ReminderTrigger reuse *Schema only.
 */
describe('goal reminder-config dual retired (residual 741)', () => {
  const apiDir = __dirname;
  const vo = readFileSync(
    resolve(apiDir, '../value-objects/goal-reminder-config.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('exports reminder-config schemas as sole shapes from VO module', () => {
    expect(vo).toContain('Residual 741');
    expect(vo).toContain('export const ReminderTriggerSchema = z.object({');
    expect(vo).toContain('export const GoalReminderConfigDTOSchema = z.object({');
  });

  it('semantic DTOs are z.infer aliases without interface dual bodies', () => {
    expect(vo).toContain(
      'export type ReminderTrigger = z.infer<typeof ReminderTriggerSchema>',
    );
    expect(vo).not.toMatch(/export interface ReminderTrigger\b/);
    expect(vo).toContain(
      'export type GoalReminderConfigDTO = z.infer<typeof GoalReminderConfigDTOSchema>',
    );
    expect(vo).not.toMatch(/export interface GoalReminderConfigDTO\b/);
  });

  it('response-schemas re-exports VO-owned schemas (no local dual bodies)', () => {
    expect(responseSchemas).toContain('Residual 741');
    expect(responseSchemas).toContain("from '../value-objects/goal-reminder-config'");
    expect(responseSchemas).toContain(
      'export { GoalReminderConfigDTOSchema, ReminderTriggerSchema }',
    );
    expect(responseSchemas).not.toMatch(
      /const ReminderTriggerSchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /const GoalReminderConfigDTOSchema = z\.object\(\{/,
    );
    expect(responseSchemas).toContain(
      'reminderConfig: GoalReminderConfigDTOSchema.nullable()',
    );
  });
});
