import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 248/252/254: AI composable types drop identity dual aliases.
 * Agent run/action and goal draft/clarification types use @dailyuse/contracts/ai names directly.
 */
describe('AI composable type dual alias single-track surface', () => {
  const dir = __dirname;
  const types = readFileSync(resolve(dir, 'types.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const goalWorkflow = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
  const goalDraftHelpers = readFileSync(resolve(dir, 'goalDraftHelpers.ts'), 'utf8');
  const goalAutomationHelpers = readFileSync(resolve(dir, 'goalAutomationHelpers.ts'), 'utf8');
  const workflowPersistence = readFileSync(resolve(dir, 'useAIWorkflowPersistence.ts'), 'utf8');
  const chatView = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
  const chatSession = readFileSync(resolve(dir, 'useAIChatSession.ts'), 'utf8');
  const goalPanel = readFileSync(
    resolve(dir, '../components/AIGoalWorkflowPanel.vue'),
    'utf8',
  );
  const actionBar = readFileSync(
    resolve(dir, '../components/AIWorkflowActionBar.vue'),
    'utf8',
  );

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

  it('does not dual-alias GoalDraft/GoalClarification identity types', () => {
    expect(types).not.toMatch(/export type GoalDraft\s*=/);
    expect(types).not.toMatch(/export type GoalClarification\s*=/);
    expect(index).not.toMatch(/\bGoalDraft\b/);
    expect(index).not.toMatch(/\bGoalClarification\b/);
    expect(index).not.toMatch(/\bGoalClarificationDTO\b/);
    expect(index).not.toMatch(/\bGoalWorkflowDraftResultDTO\b/);
  });

  it('call sites import AgentRunResult/AgentAction/AgentRun/AssistantEvent from contracts', () => {
    expect(goalWorkflow).toContain("from '@dailyuse/contracts/ai'");
    expect(goalWorkflow).toMatch(/\bAgentRunResult\b/);
    expect(goalWorkflow).toMatch(/\bAgentAction\b/);
    expect(goalWorkflow).not.toMatch(/\bGoalAgentRunResult\b/);
    expect(goalWorkflow).not.toMatch(/\bGoalAgentAction\b/);
    expect(chatView).toMatch(/\bAgentRun\b/);
    expect(chatView).not.toMatch(/\bAgentRunSummary\b/);
    // residual 351: open chat Host events replace SendMessageRes dual surface
    expect(chatSession).toMatch(/\bAssistantEvent\b/);
    expect(chatSession).not.toMatch(/\bSendMessageRes\b/);
    expect(chatSession).not.toMatch(/\bStreamDoneResult\b/);
  });

  it('call sites import GoalWorkflowDraftResultDTO/GoalClarificationDTO from contracts', () => {
    for (const source of [
      goalWorkflow,
      goalDraftHelpers,
      goalAutomationHelpers,
      workflowPersistence,
      goalPanel,
      actionBar,
    ]) {
      expect(source).toContain("from '@dailyuse/contracts/ai'");
      expect(source).toMatch(/\bGoalClarificationDTO\b/);
    }
    for (const source of [
      goalWorkflow,
      goalDraftHelpers,
      goalAutomationHelpers,
      workflowPersistence,
      goalPanel,
    ]) {
      expect(source).toMatch(/\bGoalWorkflowDraftResultDTO\b/);
    }
    // UI helper identifiers that end with GoalDraft are not type duals.
    expect(goalDraftHelpers).toMatch(/\bcreateEmptyGoalDraft\b|\bGoalDraftState\b|\bapplyGoalDraft\b/);
    expect(types).toMatch(/\bcreateEmptyGoalDraft\b/);
  });
});
