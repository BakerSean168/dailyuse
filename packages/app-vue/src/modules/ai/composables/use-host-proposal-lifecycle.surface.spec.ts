import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Batch C conformance lock.
 *
 * Goal creation is no longer a Host Proposal / AgentRun product. These tests
 * intentionally preserve only the Task/Knowledge transitional Host lanes while
 * proving that goal.create can never be fed back into them.
 */
describe('Host proposal lifecycle after ADR-052 goal.create cutover', () => {
  const dir = __dirname;
  const helper = readFileSync(resolve(dir, 'hostProposalLifecycle.ts'), 'utf8');
  const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
  const chat = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
  const persistence = readFileSync(resolve(dir, 'useAIWorkflowPersistence.ts'), 'utf8');
  const types = readFileSync(resolve(dir, 'types.ts'), 'utf8');
  const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
  const goalPanel = readFileSync(resolve(dir, '../components/AIGoalWorkflowPanel.vue'), 'utf8');
  const hostPanel = readFileSync(resolve(dir, '../components/AIHostProposalPanel.vue'), 'utf8');
  const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');
  const task = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
  const session = readFileSync(resolve(dir, 'useAIChatSession.ts'), 'utf8');

  it('makes WorkflowRuntime the sole active goal.create execution owner', () => {
    expect(goal).toContain('workflowRuntime.start');
    expect(goal).toContain('workflowRuntime.resume');
    expect(goal).toContain('workflowRuntime.get');
    expect(goal).toContain('workflowRuntime.cancel');
    expect(goal).toContain('goalWorkflowRun');
    expect(goal).toContain("kind: 'goal.create'");
    expect(goal).toContain("command: { type: 'approve' }");
    expect(goal).toContain("command: { type: 'edit_structured'");
    expect(goal).toContain("command: { type: 'retry' }");

    expect(goal).not.toContain('startAgentRun');
    expect(goal).not.toContain('resumeAgentRun');
    expect(goal).not.toContain('dispatchAssistant');
    expect(goal).not.toContain('AgentRunResult');
    expect(goal).not.toMatch(/import[^;]*\bAgentAction\b/s);
    expect(goal).not.toContain('goalAgentRun');
  });

  it('projects goal.create from typed Workflow suspension/result instead of Agent artifacts', () => {
    expect(goalPanel).toContain('goalWorkflowRun');
    expect(goalPanel).toContain("suspension?.type === 'goal_draft_review'");
    expect(goalPanel).toContain("suspension?.type === 'recovery_required'");
    expect(goalPanel).toContain('goalWorkflowRun.result');
    expect(goalPanel).toContain('data-testid="goal-workflow-panel"');
    expect(goalPanel).not.toContain('goalAgentRun');
    expect(goalPanel).not.toContain('goalAgentPendingActions');
    expect(goalPanel).not.toContain('goalAgentExecutedActions');
  });

  it('hard-isolates goal.create from Host proposal ownership and dual-mirror recovery', () => {
    expect(chatView).toContain('goalAgentRun: null');
    expect(chatView).not.toContain("payload.item.source === 'goal'");
    // Historical Host receipts may still deep-link to an already-created Goal;
    // navigation is not workflow ownership.
    expect(chatView).toContain("if (payload.source === 'goal')");
    expect(chatView).not.toContain('isHostPanelGoalSessionProductOwned');
    expect(chatView).not.toContain('shouldReviseGoalSessionDraftBeforeConfirm');

    expect(chat).not.toContain('nextDualMirroredTaskAgentRun');
    expect(chat).not.toContain('shouldDualMirrorPrimaryTaskGoalSession');
    expect(chat).not.toContain('isPrimaryTaskHostAgentRun');
    expect(chat).toContain("taskAgentRun.value.run.agentType !== 'task.create'");
    expect(chat).toContain('syncGoalWorkflowRun');
  });

  it('persists only the durable goal Workflow projection for active goal state', () => {
    expect(types).toContain('goalWorkflowRun?: import');
    expect(types).toContain('@deprecated legacy goal-create snapshot fields');
    expect(persistence).toContain('goalWorkflowRun: options.goalWorkflowRun.value');
    expect(persistence).toContain('options.goalWorkflowRun.value = entry.goalWorkflowRun ?? null');
    expect(persistence).not.toContain('goalDraft: options.goalDraft.value');
    expect(persistence).not.toContain('goalAutomationResult: options.goalAutomationResult.value');
    expect(persistence).not.toContain('goalAgentRun: options.goalAgentRun.value');
  });

  it('keeps Task and Knowledge Host Proposal lanes transitional without reopening Goal', () => {
    expect(helper).toContain('dispatchHostProposalRevise');
    expect(helper).toContain("type: 'approve_proposal'");
    expect(helper).toContain("type: 'reject_proposal'");
    expect(helper).toContain('buildPendingHostProposalItems');
    expect(helper).toContain('buildHostExecutionReceiptItems');
    expect(helper).toContain("source: 'task'");
    expect(helper).toContain("kind: 'task.create'");

    expect(knowledge).toContain('await dispatchHostProposalDecision');
    expect(knowledge).toContain("kind: 'knowledge.write'");
    expect(task).toContain('create_task_template');
    expect(chatView).toContain("payload.item.source === 'knowledge'");
    expect(chatView).toContain("payload.item.source === 'task'");
    expect(chatView).toContain('createTaskTemplate');
    expect(hostPanel).toContain('data-testid="ai-host-proposal-panel"');
  });

  it('keeps the Mastra open-chat cutover isolated from the transitional Host timeline', () => {
    expect(session).toContain('options.runtime.listMessages(conversationId)');
    expect(session).not.toContain('openChatHostTurns');
    expect(session).not.toContain('upsertOpenChatHostTurn');
    expect(chatView).toContain('openChatTurns: []');
    expect(chatView).not.toContain('openChatHostTurns');
  });
});
