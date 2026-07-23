import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 733: reminder active-hours / group-stats dual bodies retired.
 * ActiveHoursConfigDTO / GroupStatsDTO reuse *Schema only (VO-owned).
  *
 * Soft residual 827: ReminderGroupClientDTO dual retired via ReminderGroupResponseSchema
 * (see reminder-group-history-client-dto-dual surface).
  *
 * Soft residual 833: ActiveTimeConfigSchema also re-exported from VO (activatedAt)
 * (see reminder-template-active-time-schedule-execution-dual surface).
 */
describe('reminder hours/stats dual retired (residual 733)', () => {
  const apiDir = __dirname;
  const hours = readFileSync(
    resolve(apiDir, '../value-objects/active-hours-config.ts'),
    'utf8',
  );
  const stats = readFileSync(resolve(apiDir, '../value-objects/group-stats.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('exports hours/stats schemas as sole shapes from VO modules', () => {
    expect(hours).toContain('Residual 733');
    expect(hours).toContain('export const ActiveHoursConfigSchema = z.object({');
    expect(stats).toContain('Residual 733');
    expect(stats).toContain('export const GroupStatsSchema = z.object({');
  });

  it('semantic DTOs are z.infer aliases without interface dual bodies', () => {
    expect(hours).toContain(
      'export type ActiveHoursConfigDTO = z.infer<typeof ActiveHoursConfigSchema>',
    );
    expect(hours).not.toMatch(/export interface ActiveHoursConfigDTO\b/);
    expect(stats).toContain(
      'export type GroupStatsDTO = z.infer<typeof GroupStatsSchema>',
    );
    expect(stats).not.toMatch(/export interface GroupStatsDTO\b/);
  });

  it('response-schemas re-exports VO-owned schemas (no local dual bodies)', () => {
    expect(responseSchemas).toContain('Residual 733');
    expect(responseSchemas).toContain("from '../value-objects/active-hours-config'");
    expect(responseSchemas).toContain("from '../value-objects/group-stats'");
    expect(responseSchemas).toContain(
      'export { ActiveHoursConfigSchema, GroupStatsSchema, ActiveTimeConfigSchema }',
    );
    expect(responseSchemas).not.toMatch(
      /const ActiveHoursConfigSchema = z\.object\(\{/,
    );
    expect(responseSchemas).not.toMatch(
      /const GroupStatsSchema = z\.object\(\{/,
    );
    expect(responseSchemas).toContain('activeHours: ActiveHoursConfigSchema.nullable()');
    expect(responseSchemas).toContain('stats: GroupStatsSchema');
  });
});
