import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isRecord } from './isRecord';

/**
 * Residual 951: app-vue AI isRecord dual retired.
 * Sole body in isRecord.ts; useAIGoalWorkflow + useAIKnowledgeNoteWorkflow import it.
 * Soft residual 949: maskEmail dual retired
 *   (packages/authentication/src/server/shared/mask-email-dual.surface.spec.ts).
 * Soft residual 947: desktop http-envelope isRecord is a keep-boundary
 *   (arrays allowed; apps/desktop/src/main/utils/http-envelope-guards.ts).
 * Soft residual 1089: isRecord cross-package keep-boundary surface (no force-merge).
 * Soft residual 1162: contracts result/core private isRecord keep-boundary remains separate.
 * Soft residual 952: tip focused suite numbers track Residual 952 evidence tip (267/1188).
 * Soft residual 953: AI createAgentId dual retired (create-agent-id-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('AI isRecord dual retired (residual 951)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'isRecord.ts'), 'utf8');
  const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
  const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');

  it('owns sole plain-object isRecord helper body', () => {
    expect(sole).toContain('Residual 951');
    expect(sole).toMatch(/export function isRecord\b/);
    expect(sole).toContain("Boolean(value) && typeof value === 'object' && !Array.isArray(value)");
    expect(sole).toContain('Residual 1089 keep-boundary vs desktop http-envelope-guards isRecord');
  });

  it('goal and knowledge workflows import sole without local dual bodies', () => {
    expect(goal).toContain('Residual 951');
    expect(goal).toContain("import { isRecord } from './isRecord'");
    expect(goal).not.toMatch(/function isRecord\b/);
    expect(goal).toContain('isRecord(item)');
    expect(goal).toContain('isRecord(artifact?.data)');

    expect(knowledge).toContain('Residual 951');
    expect(knowledge).toContain("import { isRecord } from './isRecord'");
    expect(knowledge).not.toMatch(/function isRecord\b/);
    expect(knowledge).toContain('isRecord(recovery)');
    expect(knowledge).toContain('isRecord(action.data)');
  });

  it('accepts plain objects and rejects arrays/null/primitives', () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
    expect(isRecord('x')).toBe(false);
    expect(isRecord(0)).toBe(false);
  });
});
