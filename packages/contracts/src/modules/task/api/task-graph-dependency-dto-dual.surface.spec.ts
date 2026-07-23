import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 797: TaskGraphDependencyDTO dual body retired.
 * Sole TaskDependencyResponseSchema + z.infer (optional title fields are schema-owned superset).
 * QueryTaskTemplateGraphRes stays interface (TaskTemplateClientDTO vs TaskTemplateResponseSchema mismatch).
 */
describe('task graph dependency dto dual retired (residual 797)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'task-dependency.dto.ts'), 'utf8');
  const templateDto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('owns TaskGraphDependencyDTO as z.infer of TaskDependencyResponseSchema', () => {
    expect(dto).toContain('Residual 797');
    expect(dto).toContain("TaskDependencyResponseSchema");
    expect(dto).toContain(
      'export type TaskGraphDependencyDTO = z.infer<typeof TaskDependencyResponseSchema>',
    );
    expect(dto).not.toMatch(/export interface TaskGraphDependencyDTO\b/);
    expect(templateDto).not.toMatch(/export interface TaskGraphDependencyDTO\b/);
  });

  it('re-exports TaskGraphDependencyDTO from task-template.dto for graph consumers', () => {
    expect(templateDto).toContain('Residual 797');
    expect(templateDto).toContain(
      "import type { TaskGraphDependencyDTO } from './task-dependency.dto'",
    );
    expect(templateDto).toContain('export type { TaskGraphDependencyDTO }');
    expect(templateDto).toContain('dependencies: TaskGraphDependencyDTO[]');
    expect(templateDto).toContain('export interface QueryTaskTemplateGraphRes');
  });

  it('TaskDependencyResponseSchema owns optional title fields as superset', () => {
    expect(responseSchemas).toContain('Residual 797');
    expect(responseSchemas).toContain(
      'export const TaskDependencyResponseSchema = z.object({',
    );
    expect(responseSchemas).toContain('predecessorTaskTitle: z.string().optional()');
    expect(responseSchemas).toContain('successorTaskTitle: z.string().optional()');
    expect(responseSchemas).toContain('predecessorTaskId: brandedId<TaskTemplateId>()');
    expect(responseSchemas).toContain('successorTaskId: brandedId<TaskTemplateId>()');
  });
});
