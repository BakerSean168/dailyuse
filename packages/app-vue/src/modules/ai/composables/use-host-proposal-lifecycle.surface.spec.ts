import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 355/357: goal/knowledge waiting_approval confirm/cancel route through
 * AssistantFacade approve_proposal / reject_proposal before legacy executors.
 * Host panel lists only waiting_approval bridge proposals.
 */
describe('Host proposal lifecycle surface (residual 355/357)', () => {
  const dir = __dirname;
  const helper = readFileSync(resolve(dir, 'hostProposalLifecycle.ts'), 'utf8');
  const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
  const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');
  const types = readFileSync(resolve(dir, 'types.ts'), 'utf8');
  const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
  const panel = readFileSync(resolve(dir, '../components/AIHostProposalPanel.vue'), 'utf8');
  const receiptPanel = readFileSync(resolve(dir, '../components/AIHostExecutionReceiptPanel.vue'), 'utf8');
  const timelineStrip = readFileSync(resolve(dir, '../components/AIHostTimelineArtifactStrip.vue'), 'utf8');
  const contextPanel = readFileSync(resolve(dir, '../components/AIContextPanel.vue'), 'utf8');

  it('routes confirm/cancel lifecycle via dispatchAssistant Host commands', () => {
    expect(helper).toContain("type: 'approve_proposal'");
    expect(helper).toContain("type: 'reject_proposal'");
    expect(helper).toContain('buildAgentRunHostProposalRef');
    expect(helper).toContain('dispatchAssistant');
    expect(helper).toMatch(/service\s*\.\s*dispatchAssistant/);
    expect(helper).toContain('buildPendingHostProposalItems');
    expect(helper).toContain('buildHostExecutionReceiptItems');
    expect(helper).toContain('HostExecutionReceiptItem');
    expect(helper).toContain('resolveHostWorkbenchReopenFromAgentRun');
    expect(helper).toContain('shouldOpenHostWorkbenchFromAgentRun');
    expect(helper).toContain('buildHostTimelineArtifactItems');
    expect(helper).toContain('HostTimelineArtifactItem');
    expect(helper).toContain('resolveHostWorkbenchFocusFromTimeline');
    expect(helper).toContain('HostWorkbenchFocusTarget');
    expect(helper).toContain('dispatchHostProposalRevise');
    expect(helper).toContain("type: 'revise_proposal'");
    expect(helper).toContain('buildHostProposalPatchFromDraft');
    expect(helper).toContain('applyHostKnowledgePatchToAgentActions');
    expect(helper).toContain('targetPath');
    expect(helper).toContain('contentMarkdown');
    expect(helper).toContain('applyHostGoalPatchToAgentActions');
    expect(helper).toContain('goalDraftDescription');
    expect(helper).toContain("kind === 'goal.create'");
    expect(helper).toContain("runStatus: 'waiting_approval'");
    expect(helper).not.toContain('executeApproved');
    expect(helper).not.toContain('resumeAgentRun');

    expect(goal).toContain('dispatchHostProposalDecision');
    expect(goal).toContain("kind: 'goal.create'");
    expect(goal).toContain("decision: userDecision === 'confirm' ? 'approve' : 'reject'");
    expect(goal).toContain('resumeAgentRun');
    expect(goal).toContain('applyHostGoalPatchToAgentActions');
    expect(goal).toContain('title: hostOptions?.title');
    expect(goal).toContain('description: hostOptions?.description');
    expect(goal).not.toContain('executeApproved');

    expect(knowledge).toContain('dispatchHostProposalDecision');
    expect(knowledge).toContain("kind: 'knowledge.write'");
    expect(knowledge).toContain("decision: 'approve'");
    expect(knowledge).toContain('cancelKnowledgeNoteAgentRun');
    expect(knowledge).toContain('applyHostKnowledgePatchToAgentActions');
    expect(knowledge).toContain('targetPath: hostOptions?.targetPath');
    expect(knowledge).toContain('contentMarkdown: hostOptions?.contentMarkdown');
    expect(knowledge).not.toContain('executeApproved');

    expect(types).toContain("'dispatchAssistant'");
    expect(types).toMatch(
      /Pick<\s*AIChatService,\s*'generateGoal'\s*\|\s*'startAgentRun'\s*\|\s*'resumeAgentRun'\s*\|\s*'dispatchAssistant'\s*>/,
    );
  });

  it('mounts thin Host proposal panel for waiting_approval only', () => {
    expect(chatView).toContain('AIHostProposalPanel');
    expect(chatView).toContain('hostProposalItems');
    expect(chatView).toContain('handleHostProposalApprove');
    expect(chatView).toContain('handleHostProposalReject');
    expect(chatView).toContain('handleHostProposalRevise');
    expect(chatView).toContain('dispatchHostProposalRevise');
    expect(chatView).toContain('skipHostLifecycle');
    // Residual 371: Host proposals activate right workbench context panel.
    expect(chatView).toContain('hasPendingHostProposals');
    expect(chatView).toContain('hasPendingHostProposals.value');
    expect(chatView).toContain(':host-proposal-count="hostProposalItems.length"');
    expect(chatView).toContain('auto-open right workbench for Host proposals or execution receipts');
    expect(chatView).toContain('targetPath: payload.patch.targetPath');
    expect(chatView).toContain('contentMarkdown: payload.patch.contentMarkdown');
    expect(chatView).toContain('title: payload.patch.title ?? payload.item.title');
    expect(chatView).toContain(
      'description: payload.patch.description ?? payload.item.description',
    );
    expect(chatView).toContain('buildPendingHostProposalItems');
    expect(panel).toContain('data-testid="ai-host-proposal-panel"');
    expect(panel).toContain('ai-host-proposal-approve-');
    expect(panel).toContain('ai-host-proposal-reject-');
    expect(panel).toContain('ai-host-proposal-revise-');
    expect(panel).toContain('ai-host-proposal-title-');
    expect(panel).toContain('ai-host-proposal-description-');
    expect(panel).toContain('ai-host-proposal-target-path-');
    expect(panel).toContain('ai-host-proposal-content-');
    expect(panel).toContain('editDescription');
    expect(panel).toContain('buildHostProposalPatchFromDraft');
    expect(panel).toContain('description: draft.description');
    expect(panel).not.toContain('executeApproved');
    expect(panel).not.toContain('resumeAgentRun');
    expect(panel).not.toContain('dispatchAssistant');
    expect(contextPanel).toContain('hostProposalCount');
    expect(contextPanel).toContain('ai-context-host-proposal-count');
    expect(contextPanel).toContain('hostWorkbenchTitle');
  });

  it('mounts Host execution receipt panel after approve (residual 379)', () => {
    expect(chatView).toContain('AIHostExecutionReceiptPanel');
    expect(chatView).toContain('hostExecutionReceiptItems');
    expect(chatView).toContain('buildHostExecutionReceiptItems');
    expect(chatView).toContain('hasHostExecutionReceipts');
    expect(chatView).toContain(':host-execution-receipt-count="hostExecutionReceiptItems.length"');
    expect(chatView).toContain('hasHostExecutionReceipts.value');
    expect(receiptPanel).toContain('data-testid="ai-host-execution-receipt-panel"');
    expect(receiptPanel).toContain('ai-host-execution-receipt-');
    expect(receiptPanel).toContain('ai-host-execution-receipt-status-');
    expect(receiptPanel).toContain('ai-host-execution-receipt-summary-');
    expect(receiptPanel).not.toContain('executeApproved');
    expect(receiptPanel).not.toContain('resumeAgentRun');
    expect(receiptPanel).not.toContain('dispatchAssistant');
    expect(contextPanel).toContain('hostExecutionReceiptCount');
    expect(contextPanel).toContain('ai-context-host-receipt-count');
    expect(contextPanel).toContain('hostReceiptPending');
  });

  it('reopens Host workbench from Conversation AgentRun history (residual 381)', () => {
    expect(chatView).toContain('shouldOpenHostWorkbenchFromAgentRun');
    expect(chatView).toContain('selectAgentRunBase');
    expect(chatView).toContain('contextPanelOpen.value = true');
    expect(chatView).toContain('Residual 381');
    expect(chatView).toContain('AgentRun history');
    // useAIChatView returns restored snapshot for Host reopen decision.
    const chatViewComposable = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatViewComposable).toContain('return result');
    expect(chatViewComposable).toContain('Residual 381');
    expect(chatViewComposable).toMatch(/selectAgentRun\(run: AgentRun\).*Promise/);
  });

  it('mounts Host timeline Artifact cards in message workflow surface (residual 383)', () => {
    expect(chatView).toContain('AIHostTimelineArtifactStrip');
    expect(chatView).toContain('hostTimelineArtifactItems');
    expect(chatView).toContain('buildHostTimelineArtifactItems');
    expect(chatView).toContain('openHostWorkbenchFromTimeline');
    expect(chatView).toContain('Residual 383');
    expect(timelineStrip).toContain('data-testid="ai-host-timeline-artifact-strip"');
    expect(timelineStrip).toContain('ai-host-timeline-artifact-');
    expect(timelineStrip).toContain('hostTimelineOpenWorkbench');
    expect(timelineStrip).not.toContain('executeApproved');
    expect(timelineStrip).not.toContain('resumeAgentRun');
    expect(timelineStrip).not.toContain('dispatchAssistant');
  });

  it('Host receipt panel exposes rich replay + entity open (residual 385)', () => {
    expect(helper).toContain('contentPreview');
    expect(helper).toContain('actionLines');
    expect(helper).toContain('primaryEntityId');
    expect(helper).toContain('truncateHostContentPreview');
    expect(receiptPanel).toContain('ai-host-execution-receipt-preview-');
    expect(receiptPanel).toContain('ai-host-execution-receipt-path-');
    expect(receiptPanel).toContain('ai-host-execution-receipt-actions-');
    expect(receiptPanel).toContain('ai-host-execution-receipt-open-');
    expect(receiptPanel).toContain('openEntity');
    expect(receiptPanel).toContain('hostReceiptOpenGoal');
    expect(receiptPanel).toContain('hostReceiptOpenNote');
    expect(chatView).toContain('openHostReceiptEntity');
    expect(chatView).toContain('@open-entity="openHostReceiptEntity"');
    expect(chatView).toContain("router.push(`/goals/${payload.entityId}`)");
    expect(chatView).toContain('openRecentKnowledgeNote(payload.entityId)');
  });

  it('timeline open focuses Host proposal/receipt row (residual 387)', () => {
    expect(chatView).toContain('resolveHostWorkbenchFocusFromTimeline');
    expect(chatView).toContain('focusedHostProposalId');
    expect(chatView).toContain(':focused-proposal-id="focusedHostProposalId"');
    expect(chatView).toContain('openHostWorkbenchFromTimeline(item?: HostTimelineArtifactItem)');
    expect(panel).toContain('focusedProposalId');
    expect(panel).toContain('data-host-focus-id');
    expect(panel).toContain('data-host-focused');
    expect(panel).toContain('ring-2 ring-primary');
    expect(panel).toContain('scrollIntoView');
    expect(receiptPanel).toContain('focusedProposalId');
    expect(receiptPanel).toContain('data-host-focus-id');
    expect(receiptPanel).toContain('scrollIntoView');
  });

  it('Host proposal panel collects freeform reject reason (residual 397)', () => {
    expect(helper).toContain('normalizeHostProposalRejectReason');
    expect(helper).toContain("fallback: string = 'user_cancel'");
    expect(panel).toContain('ai-host-proposal-reject-reason-');
    expect(panel).toContain('rejectReason');
    expect(panel).toContain('rejectReasonPlaceholder');
    expect(panel).not.toContain('executeApproved');
    expect(panel).not.toContain('resumeAgentRun');
    expect(chatView).toContain('normalizeHostProposalRejectReason');
    expect(chatView).toContain('handleHostProposalReject');
    expect(chatView).toContain('payload.reason');
    // Lifecycle-only path: freeform reason never becomes a mutation executor call.
    expect(chatView).toMatch(/decision:\s*'reject'/);
  });
});
