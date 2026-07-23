import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 831: TaskDependencyClientDTO / TaskInstanceClientDTO / ScheduleTaskClientDTO
 * dual bodies retired. Sole *ResponseSchema + z.infer.
 * DependencyChainClientDTO remains interface (shape mismatch vs DependencyChainResponseSchema).
 * Soft residual 837: TaskFolderClientDTO / TaskTemplateHistoryClientDTO duals also retired
 * via TaskFolderResponseSchema / TaskTemplateHistoryResponseSchema (see task-folder-history-client-dto-dual surface).
 */
describe('task/schedule client dto duals retired (residual 831)', () => {
  const taskApi = __dirname;
  const scheduleApi = resolve(taskApi, '../../schedule/api');
  const dep = readFileSync(
    resolve(taskApi, '../aggregates/task-dependency-client.ts'),
    'utf8',
  );
  const instance = readFileSync(
    resolve(taskApi, '../aggregates/task-instance-client.ts'),
    'utf8',
  );
  const scheduleTask = readFileSync(
    resolve(taskApi, '../../schedule/aggregates/schedule-task-client.ts'),
    'utf8',
  );
  const taskSchemas = readFileSync(resolve(taskApi, 'response-schemas.ts'), 'utf8');
  const scheduleSchemas = readFileSync(resolve(scheduleApi, 'response-schemas.ts'), 'utf8');

  it('owns TaskDependencyClientDTO as z.infer; keeps DependencyChain interface dual', () => {
    expect(dep).toContain('Residual 831');
    expect(dep).toContain(
      'export type TaskDependencyClientDTO = z.infer<typeof TaskDependencyResponseSchema>',
    );
    expect(dep).not.toMatch(/export interface TaskDependencyClientDTO\b/);
    expect(dep).toMatch(/export interface DependencyChainClientDTO\b/);
    expect(dep).toContain('estimatedCompletionDate?: DomainDate');
    expect(taskSchemas).toContain('Residual 831');
    expect(taskSchemas).toContain(
      'export const TaskDependencyResponseSchema = z.object({',
    );
    const depRoutes = readFileSync(
      resolve(taskApi, '../../../../../task/src/api/routes/task-dependency.routes.ts'),
      'utf8',
    );
    expect(depRoutes).toContain(
      "successResponse(TaskDependencyResponseSchema, '创建成功')",
    );
  });

  it('owns TaskInstanceClientDTO as z.infer of TaskInstanceResponseSchema', () => {
    expect(instance).toContain('Residual 831');
    expect(instance).toContain(
      'export type TaskInstanceClientDTO = z.infer<typeof TaskInstanceResponseSchema>',
    );
    expect(instance).not.toMatch(/export interface TaskInstanceClientDTO\b/);
    expect(taskSchemas).toContain(
      'export const TaskInstanceResponseSchema = z.object({',
    );
    expect(taskSchemas).toContain('timeConfig: TaskTimeConfigSchema');
    const instRoutes = readFileSync(
      resolve(taskApi, '../../../../../task/src/api/routes/task-instance.routes.ts'),
      'utf8',
    );
    expect(instRoutes).toContain('TaskInstanceResponseSchema');
    expect(instRoutes).toContain(
      "successResponse(TaskInstanceResponseSchema, '获取成功')",
    );
  });

  it('owns ScheduleTaskClientDTO as z.infer of ScheduleTaskResponseSchema', () => {
    expect(scheduleTask).toContain('Residual 831');
    expect(scheduleTask).toContain(
      'export type ScheduleTaskClientDTO = z.infer<typeof ScheduleTaskResponseSchema>',
    );
    expect(scheduleTask).not.toMatch(/export interface ScheduleTaskClientDTO\b/);
    expect(scheduleSchemas).toContain('Residual 831');
    expect(scheduleSchemas).toContain(
      'export const ScheduleTaskResponseSchema = z.object({',
    );
    expect(scheduleSchemas).toContain(
      'executions: z.array(ScheduleExecutionResponseSchema).nullable()',
    );
    const routes = readFileSync(
      resolve(scheduleApi, '../../../../../schedule/src/api/routes.ts'),
      'utf8',
    );
    expect(routes).toContain(
      "successResponse(ScheduleTaskResponseSchema, '创建成功')",
    );
  });
});
