import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 703: schedule query params dual bodies retired.
 * ScheduleTask/Execution QueryParamsDTO reuse *QueryParamsSchema only.
 */
describe('schedule query params dual retired (residual 703)', () => {
  const apiDir = __dirname;
  const task = readFileSync(resolve(apiDir, 'requests/schedule-task-requests.ts'), 'utf8');
  const execution = readFileSync(
    resolve(apiDir, 'requests/schedule-execution-requests.ts'),
    'utf8',
  );
  const routes = readFileSync(
    resolve(apiDir, '../../../../../schedule/src/api/routes.ts'),
    'utf8',
  );
  const controller = readFileSync(
    resolve(apiDir, '../../../../../schedule/src/server/transport/schedule.controller.ts'),
    'utf8',
  );

  it('exports query params schemas as sole query shapes', () => {
    expect(task).toContain('export const ScheduleTaskQueryParamsSchema = z.object({');
    expect(execution).toContain(
      'export const ScheduleExecutionQueryParamsSchema = z.object({',
    );
  });

  it('semantic QueryParamsDTO types are z.infer aliases without interface dual bodies', () => {
    expect(task).toContain('Residual 703');
    expect(task).toContain(
      'export type ScheduleTaskQueryParamsDTO = z.infer<typeof ScheduleTaskQueryParamsSchema>',
    );
    expect(task).not.toMatch(/export interface ScheduleTaskQueryParamsDTO\b/);

    expect(execution).toContain('Residual 703');
    expect(execution).toContain(
      'export type ScheduleExecutionQueryParamsDTO = z.infer<typeof ScheduleExecutionQueryParamsSchema>',
    );
    expect(execution).not.toMatch(/export interface ScheduleExecutionQueryParamsDTO\b/);
  });

  it('routes and controller parse query schemas only', () => {
    expect(routes).toContain('ScheduleTaskQueryParamsSchema');
    expect(controller).toContain('ScheduleTaskQueryParamsSchema');
  });
});
