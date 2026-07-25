import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 789: GetTaskInstancesByRangeRes / TaskInstanceOperationRes dual bodies retired.
 * Sole *ResSchema + z.infer nesting TaskInstanceResponseSchema.
 */
describe('task instance range/op res duals retired (residual 789)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'task-instance.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('owns by-range and operation ResSchema + z.infer aliases', () => {
    expect(dto).toContain('Residual 789');
    expect(dto).toContain(
      'export const GetTaskInstancesByRangeResSchema = z.object({',
    );
    expect(dto).toContain(
      'export type GetTaskInstancesByRangeRes = z.infer<typeof GetTaskInstancesByRangeResSchema>',
    );
    expect(dto).toContain(
      'export const TaskInstanceOperationResSchema = z.object({',
    );
    expect(dto).toContain(
      'export type TaskInstanceOperationRes = z.infer<typeof TaskInstanceOperationResSchema>',
    );
    expect(dto).toContain('data: z.array(TaskInstanceResponseSchema)');
    expect(dto).toContain('instance: TaskInstanceResponseSchema');
    expect(dto).not.toMatch(/export interface GetTaskInstancesByRangeRes\b/);
    expect(dto).not.toMatch(/export interface TaskInstanceOperationRes\b/);
  });

  it('nests TaskInstanceResponseSchema from response-schemas', () => {
    expect(responseSchemas).toContain(
      'export const TaskInstanceResponseSchema = z.object({',
    );
    expect(dto).toContain("from './response-schemas'");
    expect(dto).toContain('TaskInstanceResponseSchema');
  });
});
