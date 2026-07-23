import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 787: GenerateGoalAutomationRes dual body retired.
 * Sole ResSchema + z.infer nesting plan/action/TokenUsage schemas.
 */
describe('generate goal automation res dual retired (residual 787)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'ai-goal-automation.dto.ts'), 'utf8');

  it('owns ResSchema and z.infer alias without interface dual body', () => {
    expect(dto).toContain('Residual 787');
    expect(dto).toContain('export const GenerateGoalAutomationResSchema = z.object({');
    expect(dto).toContain(
      'export type GenerateGoalAutomationRes = z.infer<typeof GenerateGoalAutomationResSchema>',
    );
    expect(dto).not.toMatch(/export interface GenerateGoalAutomationRes\b/);
  });

  it('nests plan/action/tokenUsage shared schemas', () => {
    expect(dto).toContain('plan: GoalAutomationPlanSchema');
    expect(dto).toContain('actions: z.array(GoalAutomationActionSchema)');
    expect(dto).toContain(
      'executedActions: z.array(GoalAutomationExecutedActionSchema).optional()',
    );
    expect(dto).toContain('tokenUsage: TokenUsageSchema');
    expect(dto).toContain("from '../value-objects/token-usage'");
  });
});
