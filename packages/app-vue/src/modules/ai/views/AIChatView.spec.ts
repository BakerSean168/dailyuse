import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * AI-VNEXT-07 workbench integration lock.
 *
 * Detailed runtime behavior is covered by useAIChatSession/useAIGoalWorkflow/
 * useAITaskWorkflow/useAIKnowledgeCapture specs. This suite locks the view-level
 * ownership boundary: AIChatView composes those canonical projections and does
 * not re-introduce a second client workflow engine.
 */
describe('AIChatView Mastra-native workbench', () => {
  const source = readFileSync(resolve(__dirname, 'AIChatView.vue'), 'utf8');
  const viewComposable = readFileSync(resolve(__dirname, '../composables/useAIChatView.ts'), 'utf8');
  const sidebar = readFileSync(resolve(__dirname, '../components/AIConversationSidebar.vue'), 'utf8');
  const actionBar = readFileSync(resolve(__dirname, '../components/AIWorkflowActionBar.vue'), 'utf8');
  const goalPanel = readFileSync(resolve(__dirname, '../components/AIGoalWorkflowPanel.vue'), 'utf8');
  const taskPanel = readFileSync(resolve(__dirname, '../components/AITaskWorkflowPanel.vue'), 'utf8');
  const capturePanel = readFileSync(resolve(__dirname, '../components/AIKnowledgeCapturePanel.vue'), 'utf8');

  it('composes only canonical workflow projections in the right workbench', () => {
    expect(source).toContain('AIGoalWorkflowPanel');
    expect(source).toContain('AITaskWorkflowPanel');
    expect(source).toContain('AIKnowledgeCapturePanel');
    expect(source).toContain(':goal-workflow-run="goalWorkflowRun"');
    expect(source).toContain(':task-workflow-run="taskWorkflowRun"');
    expect(source).toContain(':knowledge-capture-run="knowledgeCaptureRun"');
    expect(source).not.toContain('AIHostProposalPanel');
    expect(source).not.toContain('AIHostExecutionReceiptPanel');
    expect(source).not.toContain('AIHostTimelineArtifactStrip');
  });

  it('does not expose legacy run/proposal ownership in the view or sidebar', () => {
    expect(source).not.toMatch(/\bAgentRun\b/);
    expect(source).not.toContain('hostProposal');
    expect(source).not.toContain('pendingActions');
    expect(source).not.toContain('approvedActions');
    expect(source).not.toContain('dependsOn');
    expect(sidebar).not.toMatch(/\bAgentRun\b/);
    expect(sidebar).not.toContain('agentRuns');
    expect(sidebar).not.toContain('select-agent-run');
  });

  it('keeps open chat on the dedicated Assistant runtime and product shell client', () => {
    expect(viewComposable).toContain('AI_ASSISTANT_RUNTIME_KEY');
    expect(viewComposable).toContain('useAIChatSession');
    expect(viewComposable).toContain('useAIGoalWorkflow');
    expect(viewComposable).toContain('useAITaskWorkflow');
    expect(viewComposable).toContain('useAIKnowledgeCapture');
    expect(viewComposable).not.toContain('dispatchAssistant');
    expect(viewComposable).not.toContain('startAgentRun');
    expect(viewComposable).not.toContain('resumeAgentRun');
  });

  it('uses direct knowledge query projection instead of a runtime run lifecycle', () => {
    expect(viewComposable).toContain('useAIKnowledgeQaWorkflow');
    expect(source).toContain(':knowledge-answer="knowledgeAnswer"');
    expect(source).toContain(':can-ask-knowledge="canAskKnowledge"');
    expect(source).toContain(':ask-knowledge-from-conversation="askKnowledgeFromConversation"');
    expect(goalPanel).toContain('data-testid="knowledge-answer-panel"');
  });

  it('wires goal/task/knowledge review decisions to typed workflow actions', () => {
    expect(source).toContain('@confirm="confirmTaskAgentRun"');
    expect(source).toContain('@cancel="cancelTaskAgentRun"');
    expect(source).toContain('@retry="retryTaskAgentExecution"');
    expect(source).toContain('@confirm="confirmKnowledgeCaptureRun"');
    expect(source).toContain('@cancel="cancelKnowledgeCaptureRun"');
    expect(source).toContain('@retry="retryKnowledgeCaptureExecution"');
    expect(taskPanel).toContain('data-testid="task-agent-confirm-run"');
    expect(capturePanel).toContain('data-testid="knowledge-capture-agent-confirm-run"');
  });

  it('preserves durable goal HITL and completed-only deep-link behavior', () => {
    expect(goalPanel).toContain("suspension?.type === 'goal_draft_review'");
    expect(goalPanel).toContain("suspension?.type === 'recovery_required'");
    expect(source).toContain("goalWorkflowRun.value?.status !== 'completed'");
    expect(source).toContain("route: `/goals/${automatedGoalId.value}`");
    expect(source).toContain("intent: 'deeplink'");
  });

  it('keeps workflow surface availability owned by the shell integration', () => {
    expect(source).toContain('shellStore?.setWorkflowAvailable(available, itemCount)');
    expect(source).toContain("requestContextPanel('automatic')");
    expect(source).toContain('shellStore.closeWorkflowSurface()');
    expect(source).toContain('SHELL_WORKFLOW_MOUNT_KEY');
  });

  it('preserves mobile conversation navigation without runtime-history rows', () => {
    expect(source).toContain('data-testid="ai-mobile-sidebar-toggle"');
    expect(source).toContain('data-testid="ai-mobile-sidebar-panel"');
    expect(source).toContain('@select="selectConversationFromMobile"');
    expect(source).toContain('@select-goal="openRecentGoalFromMobile"');
    expect(source).toContain('@select-knowledge-note="openRecentKnowledgeNoteFromMobile"');
  });

  it('offers knowledge.capture once and removes the retired generation mode from product UI', () => {
    expect(source).toContain('knowledgeCaptureWorkflow');
    expect(actionBar).toContain("toolMode === 'knowledge-capture'");
    expect(source).not.toContain('knowledge-generate');
    expect(actionBar).not.toContain('knowledge-generate');
  });
});
