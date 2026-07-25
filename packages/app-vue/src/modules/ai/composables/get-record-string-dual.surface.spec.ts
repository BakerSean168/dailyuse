import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getRecordString } from './getRecordString';

/**
 * Residual 955: app-vue AI getRecordString / getString dual retired.
 * Sole body in getRecordString.ts; goal (was getString) + knowledge-note import it.
 * Soft residual 953: AI createAgentId dual retired (create-agent-id-dual.surface.spec.ts).
 * Soft residual 956: tip focused suite numbers track Residual 956 evidence tip (269/1194).
 * Soft residual 957: vault FS guards dual retired (packages/repository/src/electron/vault-fs-guards-dual.surface.spec.ts).
 * Goal local getString empty-check was behaviorally equivalent to trim sole; unified.
 * Does not flip §13.2 checkboxes.
 */
describe('AI getRecordString dual retired (residual 955)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'getRecordString.ts'), 'utf8');
  const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
  const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');

  it('owns sole getRecordString helper body', () => {
    expect(sole).toContain('Residual 955');
    expect(sole).toMatch(/export function getRecordString\b/);
    expect(sole).toContain("typeof value === 'string' ? value.trim() : ''");
  });

  it('goal and knowledge-note import sole without local dual bodies', () => {
    expect(goal).toContain('Residual 955');
    expect(goal).toContain("import { getRecordString } from './getRecordString'");
    expect(goal).not.toMatch(/function getString\b/);
    expect(goal).not.toMatch(/function getRecordString\b/);
    expect(goal).toContain('getRecordString(item,');
    expect(goal).toContain('getRecordString(goalData,');
    // Retired dual name must not remain as local helper
    expect(goal).not.toContain('function getString(data: Record<string, unknown>');

    expect(knowledge).toContain('Residual 955');
    expect(knowledge).toContain("import { getRecordString } from './getRecordString'");
    expect(knowledge).not.toMatch(/function getRecordString\b/);
    expect(knowledge).toContain('getRecordString(data,');
    expect(knowledge).toContain('getRecordString(noteData,');
    // getArtifactString may remain as thin local composer over sole
    expect(knowledge).toMatch(/function getArtifactString\b/);
    expect(knowledge).toContain('getRecordString(artifact.data, key)');
  });

  it('trims strings and rejects non-strings / whitespace-only to empty', () => {
    expect(getRecordString({ a: '  hi  ' }, 'a')).toBe('hi');
    expect(getRecordString({ a: '   ' }, 'a')).toBe('');
    expect(getRecordString({ a: 1 }, 'a')).toBe('');
    expect(getRecordString({}, 'missing')).toBe('');
  });
});
