import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 667: bind-to-goal request dual body retired.
 * Live bind-goal OpenAPI/controller parse TaskGoalBindingSchema only.
 * Residual 739: TaskGoalBindingSchema ownership moved to value-objects;
 * task-template.dto re-exports the VO-owned schema (no local dual body).
 */
describe('task bind-to-goal request dual retired (residual 667)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'task-template.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../task/src/api/routes/task-template.routes.ts'),
    'utf8',
  );
  const controller = readFileSync(
    resolve(apiDir, '../../../../../task/src/server/transport/task-template.controller.ts'),
    'utf8',
  );

  it('does not export a separate bind-to-goal zod dual body', () => {
    expect(dto).toContain('Residual 667');
    // Residual 739: schema is re-exported from VO (not a local export const dual).
    expect(dto).toMatch(
      /export \{[^}]*TaskGoalBindingSchema[^}]*\}|export const TaskGoalBindingSchema\b/,
    );
    expect(dto).toContain('export type BindToGoalReq = z.infer<typeof TaskGoalBindingSchema>');
    expect(dto).not.toMatch(/export const BindToGoalSchema\b/);
  });

  it('routes and controller parse TaskGoalBindingSchema for bind-goal', () => {
    expect(routes).toContain('TaskGoalBindingSchema');
    expect(routes).not.toContain('BindToGoalSchema');
    expect(controller).toContain('TaskGoalBindingSchema');
    expect(controller).not.toContain('BindToGoalSchema');
    expect(routes).toContain(
      "body: { content: { 'application/json': { schema: TaskGoalBindingSchema } } }",
    );
  });
});
