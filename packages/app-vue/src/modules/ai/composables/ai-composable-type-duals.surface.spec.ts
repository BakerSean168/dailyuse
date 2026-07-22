import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 248/252: AI composable types drop identity dual aliases.
 * Agent run/action types use @dailyuse/contracts/ai names directly.
 */
describe('AI composable type dual alias single-track surface', () => {
  const dir = __dirname;
  const types = readFileSync(resolve(dir, 'types.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const goalWorkflow = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
  const chatView = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
  const chatSession = readFileSync(resolve(dir, 'useAIChatSession.ts'), 'utf8');

  it('does not define unused Goal/KnowledgeNote AgentArtifact dual aliases', () => {
    expect(types).not.toContain('export type GoalAgentArtifact');
    expect(types).not.toContain('export type GoalAgentExecutedAction');
    expect(types).not.toContain('export type KnowledgeNoteAgentArtifact');
  });

  it('does not dual-alias agent run/action/stream result types', () => {
    expect(types).not.toMatch(/export type StreamDoneResult\s*=/);
    expect(types).not.toMatch(/export type AgentRunSummary\s*=/);
    expect(types).not.toMatch(/export type GoalAgentRunResult\s*=/);
    expect(types).not.toMatch(/export type KnowledgeQaAgentRunResult\s*=/);
    expect(types).not.toMatch(/export type KnowledgeNoteAgentRunResult\s*=/);
    expect(types).not.toMatch(/export type GoalAgentAction\s*=/);
    expect(index).not.toMatch(/\bGoalAgentRunResult\b/);
    expect(index).not.toMatch(/\bGoalAgentAction\b/);
    expect(index).not.toMatch(/\bKnowledgeQaAgentRunResult\b/);
    expect(index).not.toMatch(/\bKnowledgeNoteAgentRunResult\b/);
  });

  it('call sites import AgentRunResult/AgentAction/AgentRun/SendMessageRes from contracts', () => {
    expect(goalWorkflow).toContain("from '@dailyuse/contracts/ai'");
    expect(goalWorkflow).toMatch(/\bAgentRunResult\b/);
    expect(goalWorkflow).toMatch(/\bAgentAction\b/);
    expect(goalWorkflow).not.toMatch(/\bGoalAgentRunResult\b/);
    expect(goalWorkflow).not.toMatch(/\bGoalAgentAction\b/);
    expect(chatView).toMatch(/\bAgentRun\b/);
    expect(chatView).not.toMatch(/\bAgentRunSummary\b/);
    expect(chatSession).toMatch(/\bSendMessageRes\b/);
    expect(chatSession).not.toMatch(/\bStreamDoneResult\b/);
  });
});
