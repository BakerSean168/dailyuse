import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 747: task time-config dual body retired.
 * TaskTimeConfigDTO reuses TaskTimeConfigSchema only.
 * Domain TaskTimeConfig (DomainDate startDate) stays separate from transfer DTO.
  *
 * Soft residual 831: TaskInstanceClientDTO dual retired via TaskInstanceResponseSchema
 * (see task-instance-dependency-schedule-task-client-dto-dual surface).
 */
describe('task time-config dual retired (residual 747)', () => {
  const apiDir = __dirname;
  const vo = readFileSync(
    resolve(apiDir, '../value-objects/task-time-config.ts'),
    'utf8',
  );
  const templateDto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');

  it('exports TaskTimeConfigSchema as sole shape from VO module', () => {
    expect(vo).toContain('Residual 747');
    expect(vo).toContain('export const TaskTimeConfigSchema = z');
  });

  it('semantic DTO is z.infer alias without interface dual body', () => {
    expect(vo).toContain(
      'export type TaskTimeConfigDTO = z.infer<typeof TaskTimeConfigSchema>',
    );
    expect(vo).not.toMatch(/export interface TaskTimeConfigDTO\b/);
    expect(vo).toContain('export interface TaskTimeConfig {');
    expect(vo).toContain('startDate: DomainDate | null');
  });

  it('task-template.dto re-exports VO-owned schema (no local dual body)', () => {
    expect(templateDto).toContain('Residual 747');
    expect(templateDto).toContain("from '../value-objects/task-time-config'");
    expect(templateDto).toContain('export { TaskTimeConfigSchema }');
    expect(templateDto).not.toMatch(
      /const TaskTimeConfigSchema(?::[^=]+)? = z/,
    );
    expect(templateDto).toContain('timeConfig: TaskTimeConfigSchema');
  });
});
