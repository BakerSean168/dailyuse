import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createAgentId } from './createAgentId';

/**
 * Residual 953: app-vue AI createAgentId dual retired.
 * Sole body in createAgentId.ts; goal / knowledge-note / knowledge-qa / task workflows import it.
 * Soft residual 951: AI isRecord dual retired (is-record-dual.surface.spec.ts).
 * Soft residual 954: tip focused suite numbers track Residual 954 evidence tip (268/1191).
 * Soft residual 955: AI getRecordString dual retired (get-record-string-dual.surface.spec.ts).
 * Task previously used a weaker Date.now+random body — unified onto sole crypto-preferring policy.
 * Does not flip §13.2 checkboxes.
 */
describe('AI createAgentId dual retired (residual 953)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'createAgentId.ts'), 'utf8');
  const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
  const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');
  const knowledgeQa = readFileSync(resolve(dir, 'useAIKnowledgeQaWorkflow.ts'), 'utf8');
  const task = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');

  it('owns sole createAgentId helper body', () => {
    expect(sole).toContain('Residual 953');
    expect(sole).toMatch(/export function createAgentId\b/);
    expect(sole).toContain('globalThis.crypto?.randomUUID');
    expect(sole).toContain('Math.random().toString(36).slice(2, 10)');
    expect(sole).toContain('`${prefix}-${randomId}`');
  });

  it('goal / knowledge / knowledge-qa / task import sole without local dual bodies', () => {
    for (const [label, src] of [
      ['goal', goal],
      ['knowledge', knowledge],
      ['knowledgeQa', knowledgeQa],
      ['task', task],
    ] as const) {
      expect(src, label).toContain('Residual 953');
      expect(src, label).toContain("import { createAgentId } from './createAgentId'");
      expect(src, label).not.toMatch(/function createAgentId\b/);
      expect(src, label).toContain("createAgentId('run')");
      expect(src, label).toContain("createAgentId('thread')");
    }
    // Former weaker task-only dual body must not remain
    expect(task).not.toContain('Date.now().toString(36)}-${Math.random()');
  });

  it('prefixes ids and uses crypto.randomUUID when available', () => {
    const spy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '11111111-2222-4333-8444-555555555555',
    );
    expect(createAgentId('run')).toBe('run-11111111-2222-4333-8444-555555555555');
    expect(createAgentId('thread')).toBe('thread-11111111-2222-4333-8444-555555555555');
    spy.mockRestore();
  });
});
