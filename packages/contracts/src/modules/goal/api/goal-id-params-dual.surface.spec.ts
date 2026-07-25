import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 677: goal-scoped list request dual bodies retired.
 * GetGoalReviewsReq / GetKeyResultsReq reuse GoalIdParamsSchema only.
 */
describe('goal id params list dual retired (residual 677)', () => {
  const apiDir = __dirname;
  const crud = readFileSync(resolve(apiDir, 'goal-crud.dto.ts'), 'utf8');
  const review = readFileSync(resolve(apiDir, 'goal-review.dto.ts'), 'utf8');
  const keyResult = readFileSync(resolve(apiDir, 'key-result.dto.ts'), 'utf8');

  it('exports a single shared GoalIdParamsSchema', () => {
    expect(crud).toContain('Residual 677');
    expect(crud).toContain('export const GoalIdParamsSchema');
    expect(crud).toMatch(
      /export const GoalIdParamsSchema\s*=\s*z\.object\(\{\s*goalId:\s*brandedId<GoalId>\(\)/,
    );
  });

  it('review and key-result list reqs reuse GoalIdParamsSchema without dual bodies', () => {
    expect(review).toContain('Residual 677');
    expect(review).toContain(
      'export type GetGoalReviewsReq = z.infer<typeof GoalIdParamsSchema>',
    );
    expect(review).not.toMatch(/export const GetGoalReviewsSchema\b/);
    expect(review).toContain("import { GoalIdParamsSchema } from './goal-crud.dto'");

    expect(keyResult).toContain('Residual 677');
    expect(keyResult).toContain(
      'export type GetKeyResultsReq = z.infer<typeof GoalIdParamsSchema>',
    );
    expect(keyResult).not.toMatch(/export const GetKeyResultsSchema\b/);
    expect(keyResult).toContain("import { GoalIdParamsSchema } from './goal-crud.dto'");
  });
});
