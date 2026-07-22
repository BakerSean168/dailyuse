import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 248: AI composable types drop unused identity dual aliases
 * (GoalAgentArtifact / GoalAgentExecutedAction / KnowledgeNoteAgentArtifact).
 */
describe('AI composable type dual alias single-track surface', () => {
  const dir = __dirname;
  const types = readFileSync(resolve(dir, 'types.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');

  it('does not define unused Goal/KnowledgeNote AgentArtifact dual aliases', () => {
    expect(types).not.toContain('export type GoalAgentArtifact');
    expect(types).not.toContain('export type GoalAgentExecutedAction');
    expect(types).not.toContain('export type KnowledgeNoteAgentArtifact');
    expect(types).not.toMatch(/export type \w+AgentArtifact\s*=\s*AgentArtifact/);
    expect(types).not.toMatch(/export type GoalAgentExecutedAction\s*=\s*AgentExecutedAction/);
  });

  it('does not re-export dropped dual aliases from composables index', () => {
    expect(index).not.toContain('GoalAgentArtifact');
    expect(index).not.toContain('GoalAgentExecutedAction');
    expect(index).not.toContain('KnowledgeNoteAgentArtifact');
  });
});
