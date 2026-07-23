import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 729: goal workflow result dual bodies retired.
 * GoalClarification* / GoalWorkflow*Result reuse *Schema only (dto-owned).
 */
describe('goal workflow result dual retired (residual 729)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(
    resolve(apiDir, '../dtos/goal-workflow-result.dto.ts'),
    'utf8',
  );
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../ai/src/api/routes/ai-goal-generation.routes.ts'),
    'utf8',
  );

  it('exports workflow schemas as sole shapes from dto module', () => {
    expect(dto).toContain('Residual 729');
    expect(dto).toContain('export const GoalClarificationSchema = z.object({');
    expect(dto).toContain(
      'export const GoalWorkflowDraftResultDTOSchema = GenerateGoalResultDTOSchema.extend({',
    );
    expect(dto).toContain(
      'export const GoalWorkflowResultDTOSchema = z.discriminatedUnion(',
    );
  });

  it('semantic types are z.infer aliases without interface dual bodies', () => {
    expect(dto).toContain(
      'export type GoalClarificationDTO = z.infer<typeof GoalClarificationSchema>',
    );
    expect(dto).toContain(
      'export type GoalWorkflowDraftResultDTO = z.infer<typeof GoalWorkflowDraftResultDTOSchema>',
    );
    expect(dto).toContain(
      'export type GoalWorkflowResultDTO = z.infer<typeof GoalWorkflowResultDTOSchema>',
    );
    expect(dto).not.toMatch(/export interface GoalClarificationDTO\b/);
    expect(dto).not.toMatch(/export interface GoalClarificationQuestionDTO\b/);
    expect(dto).not.toMatch(/export interface GoalWorkflowDraftResultDTO\b/);
    expect(dto).not.toMatch(/export interface GoalWorkflowConfirmResultDTO\b/);
    expect(dto).not.toMatch(/export interface GoalWorkflowExecutionResultDTO\b/);
    expect(dto).not.toMatch(/export interface GoalWorkflowClarificationResultDTO\b/);
  });

  it('response-schemas re-exports dto-owned schemas; routes use GoalWorkflowResultDTOSchema', () => {
    expect(responseSchemas).toContain('Residual 729');
    expect(responseSchemas).toContain("from '../dtos/goal-workflow-result.dto'");
    expect(responseSchemas).not.toMatch(
      /export const GoalWorkflowDraftResultDTOSchema = GenerateGoalResultDTOSchema\.extend/,
    );
    expect(responseSchemas).not.toMatch(
      /const GoalClarificationSchema = z\.object\(\{/,
    );
    expect(routes).toContain('GoalWorkflowResultDTOSchema');
    expect(routes).toContain('successResponse(GoalWorkflowResultDTOSchema');
  });
});
