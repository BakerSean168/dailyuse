import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 753: goal create/update reminder-config request dual retired.
 * Request reuses residual 741 VO schemas with request-only min/max refinements.
 */
describe('goal reminder-config request dual retired (residual 753)', () => {
  const apiDir = __dirname;
  const crud = readFileSync(resolve(apiDir, 'goal-crud.dto.ts'), 'utf8');
  const vo = readFileSync(
    resolve(apiDir, '../value-objects/goal-reminder-config.ts'),
    'utf8',
  );

  it('imports VO-owned reminder schemas (no local dual bodies)', () => {
    expect(crud).toContain('Residual 753');
    expect(crud).toContain("from '../value-objects/goal-reminder-config'");
    expect(crud).toContain('GoalReminderConfigDTOSchema');
    expect(crud).toContain('ReminderTriggerSchema');
    expect(crud).not.toMatch(/const ReminderTriggerSchema = z\.object\(\{/);
    expect(crud).not.toMatch(/const GoalReminderConfigSchema = z\.object\(\{/);
  });

  it('composes request-only refinements on VO schemas', () => {
    expect(crud).toContain(
      'const GoalReminderConfigRequestSchema = GoalReminderConfigDTOSchema.extend({',
    );
    expect(crud).toContain(
      'ReminderTriggerSchema.extend({ value: z.number().min(0) })',
    );
    expect(crud).toContain('.max(10)');
    expect(crud).toContain(
      'reminderConfig: GoalReminderConfigRequestSchema.nullable().optional()',
    );
  });

  it('VO residual 741 ownership remains the sole transport/response shapes', () => {
    expect(vo).toContain('Residual 741');
    expect(vo).toContain('export const ReminderTriggerSchema = z.object({');
    expect(vo).toContain(
      'export const GoalReminderConfigDTOSchema = z.object({',
    );
  });
});
