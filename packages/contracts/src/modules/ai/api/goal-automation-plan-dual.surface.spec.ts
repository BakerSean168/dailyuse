import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 705: goal automation plan/preview dual bodies retired.
 * GoalAutomationPlanDTO / TaskTemplatePreview / ReminderPreview reuse *Schema only.
 */
describe('goal automation plan dual retired (residual 705)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'ai-goal-automation.dto.ts'), 'utf8');

  it('exports plan and preview schemas as sole shapes', () => {
    expect(dto).toContain('Residual 705');
    expect(dto).toContain('export const GoalAutomationPlanSchema = z.object({');
    expect(dto).toContain(
      'export const GoalAutomationTaskTemplatePreviewSchema = z.object({',
    );
    expect(dto).toContain(
      'export const GoalAutomationReminderPreviewSchema = z.object({',
    );
  });

  it('semantic plan/preview types are z.infer aliases without interface dual bodies', () => {
    expect(dto).toContain(
      'export type GoalAutomationPlanDTO = z.infer<typeof GoalAutomationPlanSchema>',
    );
    expect(dto).toContain(
      'export type GoalAutomationTaskTemplatePreview = z.infer<',
    );
    expect(dto).toContain(
      'typeof GoalAutomationTaskTemplatePreviewSchema',
    );
    expect(dto).toContain(
      'export type GoalAutomationReminderPreview = z.infer<',
    );
    expect(dto).toContain(
      'typeof GoalAutomationReminderPreviewSchema',
    );
    expect(dto).not.toMatch(/export interface GoalAutomationPlanDTO\b/);
    expect(dto).not.toMatch(
      /export interface GoalAutomationTaskTemplatePreview\b/,
    );
    expect(dto).not.toMatch(
      /export interface GoalAutomationReminderPreview\b/,
    );
  });

  it('GenerateGoalAutomationRes still uses GoalAutomationPlanDTO semantic type', () => {
    expect(dto).toContain('export interface GenerateGoalAutomationRes');
    expect(dto).toContain('plan: GoalAutomationPlanDTO');
  });
});
