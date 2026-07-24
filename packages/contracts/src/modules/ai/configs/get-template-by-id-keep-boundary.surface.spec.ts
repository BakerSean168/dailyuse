import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1186: getTemplateById keep-boundary (AI provider vs goal OKR catalogs).
 * - contracts AI: AIProviderTemplate from AI_PROVIDER_TEMPLATES (baseUrl/model)
 * - goal: GoalTemplate from BUILT_IN_TEMPLATES (category/keyResults)
 * Soft residual 1183: defaultExtractContext keep-boundary remains separate.
 * Soft residual 1180: comparePriority keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('getTemplateById keep-boundary (residual 1186)', () => {
  const dir = __dirname;
  const ai = readFileSync(resolve(dir, 'ai-provider-template.ts'), 'utf8');
  const goal = readFileSync(
    resolve(dir, '../../../../../goal/src/application-client/goal-templates.ts'),
    'utf8',
  );

  it('owns Residual 1186 keep-boundary markers on AI provider getTemplateById', () => {
    expect(ai).toContain('Residual 1186 keep-boundary');
    expect(ai).toMatch(/export function getTemplateById\b/);
    expect(ai).toContain('AIProviderTemplate');
    expect(ai).toContain('AI_PROVIDER_TEMPLATES');
    const body = ai.match(/export function getTemplateById\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('AI_PROVIDER_TEMPLATES.find');
    expect(body).toContain('template.id');
    expect(body).not.toContain('BUILT_IN_TEMPLATES');
    expect(body).not.toContain('GoalTemplate');
  });

  it('differs from goal OKR catalog getTemplateById (no force-merge)', () => {
    expect(goal).toContain('Residual 1186 keep-boundary');
    expect(goal).toMatch(/export function getTemplateById\b/);
    expect(goal).toContain('Soft residual 1186');
    expect(goal).toContain('GoalTemplate');
    expect(goal).toContain('BUILT_IN_TEMPLATES');
    const body = goal.match(/export function getTemplateById\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('BUILT_IN_TEMPLATES.find');
    expect(body).not.toContain('AI_PROVIDER_TEMPLATES');
    expect(body).not.toContain('AIProviderTemplate');
    expect(body).not.toContain('baseUrl');
  });

  it('runtime: documents AI provider vs goal catalog contracts via body shape', () => {
    const aiTemplates = [{ id: 'gemini', baseUrl: 'https://example' }];
    const goalTemplates = [{ id: 'okr-eng', category: 'engineering', keyResults: [] as string[] }];
    function aiGet(id: string) {
      return aiTemplates.find((template) => template.id === id);
    }
    function goalGet(id: string) {
      return goalTemplates.find((t) => t.id === id);
    }
    expect(aiGet('gemini')).toEqual({ id: 'gemini', baseUrl: 'https://example' });
    expect(goalGet('okr-eng')).toEqual({ id: 'okr-eng', category: 'engineering', keyResults: [] });
    expect(aiGet('okr-eng')).toBeUndefined();
    expect(goalGet('gemini')).toBeUndefined();
  });

  it('documents residual 1186 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'get-template-by-id-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1186');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
