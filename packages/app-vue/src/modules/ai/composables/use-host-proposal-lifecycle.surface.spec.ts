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
  const session = readFileSync(resolve(dir, 'useAIChatSession.ts'), 'utf8');
  const turnMemory = readFileSync(resolve(dir, 'hostOpenChatTurnMemory.ts'), 'utf8');
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
    // Residual 587: Host lifecycle kind is hostProposalKind (task.create for primary-task).
    expect(goal).toContain('kind: hostProposalKind');
    expect(goal).toContain("? 'task.create'");
    expect(goal).toContain(": 'goal.create'");
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
    // Residual 411: composition helper owns open-chat + AgentRun assembly.
    expect(chatView).toContain('composeHostWorkbenchTimelineArtifacts');
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

  it('Host timeline Artifact cards expose multi-engine badge (residual 399)', () => {
    expect(helper).toContain('resolveHostTimelineEngineKey');
    expect(helper).toContain('HostTimelineEngineKey');
    expect(helper).toContain('engineKey');
    expect(helper).toContain('agent_run.goal_create');
    expect(helper).toContain('engine.pi_readonly');
    expect(timelineStrip).toContain('ai-host-timeline-artifact-engine-');
    expect(timelineStrip).toContain('data-engine-key');
    expect(timelineStrip).toContain('engineLabel');
    expect(timelineStrip).not.toContain('executeApproved');
    expect(timelineStrip).not.toContain('dispatchAssistant');
  });

  it('open-chat Host turns appear on timeline with engine badges (residual 401)', () => {
    expect(helper).toContain('buildHostOpenChatTimelineArtifactItems');
    expect(helper).toContain("surface: 'open_chat'");
    expect(helper).toContain("kind: 'open_chat.turn'");
    expect(helper).toContain('HostOpenChatTurnSnapshot');
    expect(session).toContain('openChatHostTurns');
    expect(session).toContain('upsertOpenChatHostTurn');
    expect(chatView).toContain('openChatHostTurns');
    expect(timelineStrip).toContain('hostTimelineOpenChat');
    expect(timelineStrip).toContain("item.surface === 'open_chat'");
    expect(timelineStrip).not.toContain('executeApproved');
  });

  it('persists open-chat Host turn badges per conversation in session (residual 403)', () => {
    expect(turnMemory).toContain('rememberOpenChatHostTurnsForConversation');
    expect(turnMemory).toContain('restoreOpenChatHostTurnsForConversation');
    expect(turnMemory).toContain('forgetOpenChatHostTurnsForConversation');
    expect(turnMemory).toContain('upsertOpenChatHostTurnList');
    expect(turnMemory).not.toContain('localStorage');
    expect(session).toContain('openChatHostTurnMemory');
    expect(session).toContain('stashOpenChatHostTurnsForCurrentConversation');
    expect(session).toContain('restoreOpenChatHostTurns');
    expect(session).toContain('rememberOpenChatHostTurnsForConversation');
    expect(session).toContain('forgetOpenChatHostTurnsForConversation');
  });

  it('composes Host workbench timeline with isolation (residual 411)', () => {
    expect(helper).toContain('partitionHostTimelineArtifactsBySurface');
    expect(helper).toContain('collectHostTimelineSurfaceIsolationViolations');
    expect(helper).toContain('Residual 409');
    expect(helper).toContain('composeHostWorkbenchTimelineArtifacts');
    expect(helper).toContain('Residual 411');
    expect(helper).toContain('isolationOk');
    expect(helper).toContain('HostWorkbenchTimelineComposition');
    expect(chatView).toContain('composeHostWorkbenchTimelineArtifacts');
    expect(chatView).toContain('hostWorkbenchTimeline');
    expect(chatView).toContain('hostTimelineArtifactItems');
    // Live path must not reassemble open-chat + AgentRun builders ad hoc.
    expect(chatView).not.toMatch(
      /buildHostOpenChatTimelineArtifactItems\(openChatHostTurns\.value\)/,
    );
    expect(chatView).not.toMatch(/buildHostTimelineArtifactItems\(\{\s*proposals:/);
    expect(helper).not.toContain('executeApproved');
  });

  it('Host task.create proposal/receipt lane foundation (residual 419)', () => {
    expect(helper).toContain("source: 'task'");
    expect(helper).toContain("kind: 'task.create'");
    expect(helper).toContain('taskAgentRun');
    expect(helper).toContain('taskDraftTitle');
    expect(helper).toContain('taskDraftGoalId');
    // Residual 585: exclusive primary-task lane (not bare isTaskShaped alias).
    expect(helper).toContain('isPrimaryTaskHostAgentRun');
    expect(helper).not.toContain('looksLikeTaskHostRun');
    expect(panel).toContain("item.kind === 'task.create'");
    expect(panel).toContain('editGoalId');
    expect(panel).toContain('ai-host-proposal-goal-id-');
    expect(receiptPanel).toContain('hostReceiptKindTask');
    expect(chatView).toContain("source === 'task'");
    expect(chatView).toContain('/tasks/');
    expect(helper).not.toContain('executeApproved');
  });

  it('Host task.create live lane + domain executor foundation (residual 423)', () => {
    expect(helper).toContain('resolveLiveHostWorkbenchAgentRuns');
    expect(helper).toContain('isPrimaryTaskHostAgentRun');
    expect(helper).toContain('applyHostTaskPatchToAgentActions');
    expect(helper).toContain('buildHostTaskCreateTemplateRequest');
    expect(helper).not.toContain('executeApproved');
    expect(chatView).toContain('resolveLiveHostWorkbenchAgentRuns');
    expect(chatView).toContain('liveHostWorkbenchAgentRuns');
    expect(chatView).toContain('taskAgentRun: liveHostWorkbenchAgentRuns.value.taskAgentRun');
    expect(chatView).toContain('buildHostTaskCreateTemplateRequest');
    expect(chatView).toContain('createTaskTemplate');
    expect(chatView).toContain("source === 'task'");
    // Domain executor uses skipHostLifecycle resume or createTemplate fallback.
    expect(chatView).toMatch(/confirmGoalAgentRun\(\{[\s\S]*skipHostLifecycle: true/);
    expect(chatView).not.toContain('domain Task executor not wired');
  });

  it('Host task.create client settlement + receipt after createTemplate (residual 425)', () => {
    expect(helper).toContain('buildHostTaskClientExecutionReceipt');
    expect(helper).toContain('filterPendingHostProposalsByClientSettlement');
    expect(helper).toContain('mergeHostExecutionReceiptItems');
    expect(helper).toContain('settledProposalIds');
    expect(helper).toContain('clientTaskReceipts');
    expect(helper).not.toContain('executeApproved');
    expect(chatView).toContain('buildHostTaskClientExecutionReceipt');
    expect(chatView).toContain('clientSettledHostProposalIds');
    expect(chatView).toContain('clientTaskHostReceipts');
    expect(chatView).toContain('settledProposalIds: clientSettledHostProposalIds.value');
    expect(chatView).toContain('clientTaskReceipts: clientTaskHostReceipts.value');
    expect(chatView).toContain('created?.template?.id');
  });

  it('Host AgentType task.create foundation + dedicated session field (residual 427)', () => {
    expect(helper).toContain("agentType === 'task.create'");
    expect(helper).toContain('isPrimaryTaskHostAgentRun');
    expect(chatView).toContain('taskAgentRun: taskAgentRun.value');
    expect(chatView).toContain('isTaskAgentType');
    const agentDto = readFileSync(
      resolve(dir, '../../../../../contracts/src/modules/ai/api/ai-agent.dto.ts'),
      'utf8',
    );
    expect(agentDto).toContain("'task.create'");
    const chatViewTs = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatViewTs).toContain("agentType === 'task.create'");
    expect(chatViewTs).toContain('const taskAgentRun = ref');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create process-local run store foundation (residual 435)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    expect(store).toContain('createHostTaskCreateRunStore');
    expect(store).toContain('getDefaultHostTaskCreateRunStore');
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(runtime).toContain('taskCreateRunStore');
    expect(runtime).toContain('taskCreateRunStore.upsert');
    expect(runtime).toContain('taskCreateRunStore.get');
    expect(runtime).toContain('taskCreateRunStore.list');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create process-local product journey foundation (residual 449)', () => {
    const journey = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/__tests__/host-task-create-product.journey.spec.ts',
      ),
      'utf8',
    );
    expect(journey).toContain('Host task.create process-local product journey (residual 449)');
    expect(journey).toContain('start → edit → cancel');
    expect(journey).toContain('start → confirm settle');
    expect(journey).toContain('identity fail-closed');
    expect(journey).toContain('port.startRun must not run for task.create');
    expect(journey).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create process-local runId identity binding (residual 451)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(store).toContain('HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE');
    expect(store).toContain('already bound to another identity');
    expect(store).toContain('Residual 451');
    expect(runtime).toContain('HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE');
    expect(runtime).toContain("error('FORBIDDEN'");
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create confirm requires client settlement executedActions (residual 453)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_REQUIRES_CLIENT_SETTLEMENT_MESSAGE');
    expect(resume).toContain('requires non-empty client executedActions settlement');
    expect(resume).toContain('Residual 453');
    expect(resume).not.toContain('defaultExecutedFromApproved');
    expect(resume).not.toContain('Task template settlement recorded by Host task.create resume.');
    // Client complete path still owns createTemplate settlement payload.
    expect(taskWorkflow).toContain("userDecision: 'confirm'");
    expect(taskWorkflow).toContain('executedActions');
    expect(taskWorkflow).toContain('create_task_template');
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create edit requires non-empty revised title (residual 455)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_TITLE_MESSAGE');
    expect(resume).toContain('requires a non-empty revised title');
    expect(resume).toContain('Residual 455');
    expect(resume).toContain('must use tool create_task_template');
    // Client revise path still patches create_task_template actions only.
    expect(taskWorkflow).toContain("userDecision: 'edit'");
    expect(taskWorkflow).toContain('applyHostTaskPatchToAgentActions');
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create process-local conversation/thread runId binding (residual 457)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(store).toContain('HOST_TASK_CREATE_RUN_ID_CONVERSATION_BOUND_MESSAGE');
    expect(store).toContain('HOST_TASK_CREATE_RUN_ID_THREAD_BOUND_MESSAGE');
    expect(store).toContain('already bound to another conversation');
    expect(store).toContain('already bound to another thread');
    expect(store).toContain('Residual 457');
    expect(runtime).toContain('HOST_TASK_CREATE_RUN_ID_CONVERSATION_BOUND_MESSAGE');
    expect(runtime).toContain('HOST_TASK_CREATE_RUN_ID_THREAD_BOUND_MESSAGE');
    expect(runtime).toContain("error('VALIDATION_ERROR'");
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create dirty approve revises process-local draft before domain settle (residual 459)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('shouldReviseProcessLocalTaskDraftBeforeDomainSettle');
    expect(helper).toContain('Residual 459');
    expect(chatView).toContain('shouldReviseProcessLocalTaskDraftBeforeDomainSettle');
    expect(chatView).toContain('Residual 459');
    expect(chatView).toContain('reviseTaskAgentRun');
    // Dirty approve still domain-settles via createTemplate + completeTaskAgentRun, never executeApproved.
    expect(chatView).toContain('createTaskTemplate');
    expect(chatView).toContain('completeTaskAgentRun');
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create start requires non-empty conversationId (residual 461)', () => {
    const start = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-start.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(start).toContain('HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE');
    expect(start).toContain('resolveTaskCreateConversationId');
    expect(start).toContain('Residual 461');
    expect(runtime).toContain('HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE');
    expect(runtime).toContain('resolveTaskCreateConversationId');
    expect(taskWorkflow).toContain('chatConversationId.value?.trim()');
    expect(taskWorkflow).toContain('Residual 461');
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create confirm requires recoverable settlement title (residual 463)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TITLE_MESSAGE');
    expect(resume).toContain('non-empty settlement title');
    expect(resume).toContain('resolveConfirmSettlementTitle');
    expect(resume).toContain('Residual 463');
    // Client complete path still carries title into executedActions data.
    expect(taskWorkflow).toContain('completeTaskAgentRun');
    expect(taskWorkflow).toContain('payloadBase');
    expect(taskWorkflow).toContain("payloadBase['title']");
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create confirm requires recoverable settlement template id (residual 465)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TEMPLATE_ID_MESSAGE');
    expect(resume).toContain('non-empty settlement template entity id');
    expect(resume).toContain('resolveConfirmSettlementTemplateId');
    expect(resume).toContain('Residual 465');
    // Client complete path carries templateId as entityId into executedActions.
    expect(taskWorkflow).toContain('completeTaskAgentRun');
    expect(taskWorkflow).toContain('templateId');
    expect(taskWorkflow).toContain('entityId: templateId');
    expect(taskWorkflow).toContain('Residual 465');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create confirm forbids settlement goalId rebind (residual 467)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_GOAL_REBIND_FORBIDDEN_MESSAGE');
    expect(resume).toContain('must not rebind settlement goalId');
    expect(resume).toContain('resolveConfirmSettlementGoalId');
    expect(resume).toContain('Residual 467');
    // Client complete still stamps optional goalId; Host is fail-closed source of truth.
    expect(taskWorkflow).toContain('completeTaskAgentRun');
    expect(taskWorkflow).toContain("payloadBase['goalId']");
    expect(taskWorkflow).toContain('Residual 467');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create confirm forbids settlement title rebind (residual 469)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_TITLE_REBIND_FORBIDDEN_MESSAGE');
    expect(resume).toContain('must not rebind settlement title');
    expect(resume).toContain('resolveConfirmSettlementTitle');
    expect(resume).toContain('Residual 469');
    // Client complete stamps title; Host forbids rebind vs approved draft.
    expect(taskWorkflow).toContain('completeTaskAgentRun');
    expect(taskWorkflow).toContain("payloadBase['title']");
    expect(taskWorkflow).toContain('Residual 469');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create confirm uses process-local draft only (residual 471)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_REQUIRES_STORE_DRAFT_MESSAGE');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_REQUIRES_SINGLE_EXECUTED_MESSAGE');
    expect(resume).toContain('resolveConfirmStoreDraftActions');
    expect(resume).toContain('exactly one create_task_template executedAction');
    expect(resume).toContain('Residual 471');
    // Client confirm no longer sends approvedActions revise payload.
    expect(taskWorkflow).toContain('completeTaskAgentRun');
    expect(taskWorkflow).toContain('Residual 471');
    expect(taskWorkflow).not.toContain("userDecision: 'confirm',\n        ...(approvedActions");
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create edit requires single approvedAction (residual 473)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_EDIT_REQUIRES_SINGLE_ACTION_MESSAGE');
    expect(resume).toContain('exactly one create_task_template approvedAction');
    expect(resume).toContain('Residual 473');
    // Client revise path still patches single create_task_template via approvedActions.
    expect(taskWorkflow).toContain('reviseTaskAgentRun');
    expect(taskWorkflow).toContain("userDecision: 'edit'");
    expect(taskWorkflow).toContain('Residual 473');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create confirm requires waiting_approval only (residual 475)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_REQUIRES_WAITING_APPROVAL_MESSAGE');
    expect(resume).toContain('confirm requires waiting_approval');
    expect(resume).toContain('Residual 475');
    expect(resume).not.toContain('waiting_approval/waiting_execution');
    // Client revise still gates on waiting_approval and sends single create_task_template.
    expect(taskWorkflow).toContain("run.run.status !== 'waiting_approval'");
    expect(taskWorkflow).toContain("action.tool === 'create_task_template'");
    expect(taskWorkflow).toContain('Residual 475');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create cancel requires waiting_approval only (residual 477)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_CANCEL_REQUIRES_WAITING_APPROVAL_MESSAGE');
    expect(resume).toContain('cancel requires waiting_approval');
    expect(resume).toContain('Residual 477');
    expect(resume).not.toContain('non-terminal active run');
    // Client cancel gates on waiting_approval product status.
    expect(taskWorkflow).toContain('cancelTaskAgentRun');
    expect(taskWorkflow).toContain('Residual 477');
    expect(taskWorkflow).toContain("run.run.status !== 'waiting_approval'");
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create start requires non-empty title without default invent (residual 479)', () => {
    const start = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-start.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(start).toContain('HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE');
    expect(start).toContain('Residual 479');
    expect(start).toContain('resolveTaskCreateTitle');
    expect(start).not.toContain("?? 'New task'");
    expect(runtime).toContain('HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE');
    expect(runtime).toContain('Residual 479');
    expect(runtime).toContain('resolveTaskCreateTitle');
    expect(helper).not.toContain('executeApproved');
  });



  it('task.create edit requires waiting_approval only (residual 481)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(resume).toContain('HOST_TASK_CREATE_EDIT_REQUIRES_WAITING_APPROVAL_MESSAGE');
    expect(resume).toContain('edit requires waiting_approval');
    expect(resume).toContain('Residual 481');
    expect(resume).not.toContain("current status is '${status}'");
    expect(resume).not.toContain('active approval run');
    // Client revise gates on waiting_approval product status.
    expect(taskWorkflow).toContain('reviseTaskAgentRun');
    expect(taskWorkflow).toContain('Residual 481');
    expect(taskWorkflow).toContain("run.run.status !== 'waiting_approval'");
    expect(helper).not.toContain('executeApproved');
  });



  it('task.create start requires non-empty conversationId in builder (residual 483)', () => {
    const start = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-start.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(start).toContain('HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE');
    expect(start).toContain('Residual 483');
    expect(start).toContain('resolveTaskCreateConversationId');
    expect(start).not.toContain("resolveTaskCreateConversationId(input.request.conversationId) ?? null");
    expect(runtime).toContain('HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE');
    expect(runtime).toContain('Residual 461/483');
    expect(helper).not.toContain('executeApproved');
  });



  it('task.create start requires non-empty threadId in builder (residual 485)', () => {
    const start = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-start.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(start).toContain('HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE');
    expect(start).toContain('resolveTaskCreateThreadId');
    expect(start).toContain('Residual 485');
    expect(runtime).toContain('HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE');
    expect(runtime).toContain('resolveTaskCreateThreadId');
    expect(runtime).toContain('Residual 485');
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create start requires non-empty identityId from ExecutionContext (residual 493)', () => {
    const start = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-start.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(start).toContain('HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE');
    expect(start).toContain('resolveTaskCreateIdentityId');
    expect(start).toContain('Residual 493');
    expect(runtime).toContain('HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE');
    expect(runtime).toContain('resolveTaskCreateIdentityId');
    expect(runtime).toContain('Residual 493');
    // Client body identity must not be trusted — builder uses ExecutionContext-resolved identity only.
    expect(start).toContain('never trust client body identity');
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create resume agentType + unsupported decision use named constants (residual 495)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(resume).toContain('HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE');
    expect(resume).toContain('HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE');
    expect(resume).toContain('Residual 495');
    expect(resume).toContain('throw new Error(HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE)');
    expect(resume).toContain('HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE');
    expect(store).toContain('HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE');
    expect(store).toContain('Residual 495');
    expect(store).not.toMatch(/agentType !== 'task\.create'\)\s*\{\s*return;/);
    expect(runtime).toContain('HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE');
    expect(runtime).toContain('HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create start requires non-empty runId in builder (residual 497)', () => {
    const start = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-start.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(start).toContain('HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE');
    expect(start).toContain('resolveTaskCreateRunId');
    expect(start).toContain('Residual 497');
    expect(runtime).toContain('HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE');
    expect(runtime).toContain('resolveTaskCreateRunId');
    expect(runtime).toContain('Residual 497');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create start requires agentType task.create in builder (residual 499)', () => {
    const start = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-start.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(start).toContain('HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE');
    expect(start).toContain('Residual 499');
    expect(start).toContain("input.request.agentType !== 'task.create'");
    expect(runtime).toContain('HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE');
    expect(runtime).toContain('Residual 499');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create client complete settlement draft is create_task_template only (residual 501)', () => {
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(taskWorkflow).toContain('completeTaskAgentRun');
    expect(taskWorkflow).toContain('Residual 501');
    const completeIdx = taskWorkflow.indexOf('async function completeTaskAgentRun');
    expect(completeIdx).toBeGreaterThan(-1);
    const completeSlice = taskWorkflow.slice(completeIdx, completeIdx + 2200);
    // Residual 501/547: sole create_task_template draftAction — not blind pendingActions[0]/find invent.
    expect(completeSlice).toContain("action.tool === 'create_task_template'");
    expect(completeSlice).toContain('productDrafts.length !== 1');
    expect(completeSlice).toContain('const draftAction = productDrafts[0]');
    expect(completeSlice).toContain('Residual 501');
    expect(completeSlice).not.toContain('pendingActions[0] ?? run.state.approvedActions[0]');
    // Still waiting_approval + templateId double-gates (residuals 489/465).
    expect(completeSlice).toContain("run.run.status !== 'waiting_approval'");
    expect(completeSlice).toContain('if (!templateId) return');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create process-local store identity match trims (residual 503)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(store).toContain('matchesHostTaskCreateIdentity');
    expect(store).toContain('resolveTaskCreateIdentityId');
    expect(store).toContain('Residual 503');
    expect(store).toContain('matchesHostTaskCreateIdentity(result.run.identityId, identityId)');
    expect(store).toContain('matchesHostTaskCreateIdentity(run.identityId, identityId)');
    // Runtime ownership helper shares store trim matcher (getRun/list/resume isolation).
    expect(runtime).toContain('Residual 503');
    expect(runtime).toContain('function ensureAgentRunOwnedByIdentity');
    expect(runtime).toContain('matchesHostTaskCreateIdentity(result.run.identityId, identityId)');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create process-local store runId lookup trims (residual 505)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    const start = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-start.ts',
      ),
      'utf8',
    );
    expect(store).toContain('resolveTaskCreateRunId');
    expect(store).toContain('HOST_TASK_CREATE_RUN_STORE_REQUIRES_RUN_ID_MESSAGE');
    expect(store).toContain('Residual 505');
    // get/upsert map key uses start-builder runId trim semantics.
    expect(store).toContain('const key = resolveTaskCreateRunId(runId)');
    expect(store).toContain('const runId = resolveTaskCreateRunId(result.run.runId)');
    expect(start).toContain('resolveTaskCreateRunId');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create client revise draft is create_task_template only (residual 507)', () => {
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(taskWorkflow).toContain('reviseTaskAgentRun');
    expect(taskWorkflow).toContain('Residual 507');
    const reviseIdx = taskWorkflow.indexOf('async function reviseTaskAgentRun');
    expect(reviseIdx).toBeGreaterThan(-1);
    const reviseSlice = taskWorkflow.slice(reviseIdx, reviseIdx + 2200);
    // Residual 507/547: sole create_task_template draftAction — not blind source first-entry/find invent.
    expect(reviseSlice).toContain("action.tool === 'create_task_template'");
    expect(reviseSlice).toContain('productDrafts.length !== 1');
    expect(reviseSlice).toContain('const draftAction = productDrafts[0]');
    expect(reviseSlice).toContain('Residual 507');
    expect(reviseSlice).not.toContain('?? source[0]');
    expect(reviseSlice).not.toContain('source.find((action) => action.tool === \'create_task_template\') ?? source[0]');
    // Still waiting_approval double-gate (residual 481) and single approvedAction (475).
    expect(reviseSlice).toContain("run.run.status !== 'waiting_approval'");
    expect(reviseSlice).toContain('if (approvedActions.length !== 1) return');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create client complete/revise sole draftAction after single-product-draft gate (residual 547)', () => {
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(taskWorkflow).toContain('Residual 547');
    expect(taskWorkflow).toContain('productDrafts.length !== 1');
    expect(taskWorkflow).toContain('const draftAction = productDrafts[0]');
    const completeIdx = taskWorkflow.indexOf('async function completeTaskAgentRun');
    const reviseIdx = taskWorkflow.indexOf('async function reviseTaskAgentRun');
    expect(completeIdx).toBeGreaterThan(-1);
    expect(reviseIdx).toBeGreaterThan(-1);
    const completeSlice = taskWorkflow.slice(completeIdx, completeIdx + 2400);
    const reviseSlice = taskWorkflow.slice(reviseIdx, reviseIdx + 2400);
    expect(completeSlice).toContain('const draftPool');
    expect(completeSlice).toContain('productDrafts.length !== 1');
    expect(completeSlice).toContain('draftAction.payload');
    expect(reviseSlice).toContain('productDrafts.length !== 1');
    expect(reviseSlice).toContain('applyHostTaskPatchToAgentActions([draftAction]');
    // No multi-find invent on either product path.
    expect(completeSlice).not.toContain(".find((action) => action.tool === 'create_task_template')");
    expect(reviseSlice).not.toContain(".find((action) => action.tool === 'create_task_template')");
    expect(helper).not.toContain('executeApproved');
  });

  it('workbench product draft readers use soleProductDraftAction (residual 549)', () => {
    expect(helper).toContain('Residual 549');
    expect(helper).toContain('function soleProductDraftAction');
    expect(helper).toContain('productDrafts.length !== 1');
    expect(helper).toContain('const draftAction = productDrafts[0]');
    // Product-lane draft resolvers delegate to soleProductDraftAction (no multi-find invent).
    const taskFn = helper.indexOf('function firstCreateTaskTemplateAction');
    const knowledgeFn = helper.indexOf('function firstCreateKnowledgeNoteAction');
    const goalFn = helper.indexOf('function firstCreateGoalAction');
    const rationaleFn = helper.indexOf('function firstPendingRationale');
    expect(taskFn).toBeGreaterThan(-1);
    expect(knowledgeFn).toBeGreaterThan(-1);
    expect(goalFn).toBeGreaterThan(-1);
    expect(rationaleFn).toBeGreaterThan(-1);
    expect(helper.slice(taskFn, taskFn + 280)).toContain("soleProductDraftAction(run, 'create_task_template')");
    expect(helper.slice(knowledgeFn, knowledgeFn + 280)).toContain("soleProductDraftAction(run, 'create_knowledge_note')");
    expect(helper.slice(goalFn, goalFn + 280)).toContain("soleProductDraftAction(run, 'create_goal')");
    expect(helper.slice(rationaleFn, rationaleFn + 350)).toContain('soleProductDraftAction(run, productTool)');
    expect(helper.slice(taskFn, taskFn + 280)).not.toContain('.find(');
    expect(helper.slice(knowledgeFn, knowledgeFn + 280)).not.toContain('.find(');
    expect(helper.slice(goalFn, goalFn + 280)).not.toContain('.find(');
    expect(helper).not.toContain('executeApproved');
  });


  it('applyHost*Patch uses sole product draftAction only (residual 551)', () => {
    expect(helper).toContain('Residual 551');
    expect(helper).toContain('productDraftCount !== 1');
    const knowledgeFn = helper.indexOf('export function applyHostKnowledgePatchToAgentActions');
    const goalFn = helper.indexOf('export function applyHostGoalPatchToAgentActions');
    const taskFn = helper.indexOf('export function applyHostTaskPatchToAgentActions');
    expect(knowledgeFn).toBeGreaterThan(-1);
    expect(goalFn).toBeGreaterThan(-1);
    expect(taskFn).toBeGreaterThan(-1);
    expect(helper.slice(knowledgeFn, knowledgeFn + 900)).toContain("action.tool === 'create_knowledge_note'");
    expect(helper.slice(knowledgeFn, knowledgeFn + 900)).toContain('productDraftCount !== 1');
    expect(helper.slice(goalFn, goalFn + 800)).toContain("action.tool === 'create_goal'");
    expect(helper.slice(goalFn, goalFn + 800)).toContain('productDraftCount !== 1');
    expect(helper.slice(taskFn, taskFn + 900)).toContain("action.tool === 'create_task_template'");
    expect(helper.slice(taskFn, taskFn + 900)).toContain('productDraftCount !== 1');
    expect(helper).not.toContain('executeApproved');
  });


  it('knowledge.write confirm requires sole create_knowledge_note draftAction (residual 555)', () => {
    const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');
    expect(knowledge).toContain('Residual 555');
    expect(knowledge).toContain('productDraftCount !== 1');
    expect(knowledge).toContain("action.tool === 'create_knowledge_note'");
    const createIdx = knowledge.indexOf('async function createKnowledgeNoteFromConversation');
    expect(createIdx).toBeGreaterThan(-1);
    const createSlice = knowledge.slice(createIdx, createIdx + 2200);
    expect(createSlice).toContain('productDraftCount !== 1');
    expect(createSlice).toContain('applyHostKnowledgePatchToAgentActions');
    // Gate before Host patch / confirm resume.
    const gateIdx = createSlice.indexOf('productDraftCount !== 1');
    const patchIdx = createSlice.indexOf('applyHostKnowledgePatchToAgentActions');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(patchIdx).toBeGreaterThan(gateIdx);
    expect(helper).not.toContain('executeApproved');
  });

  it('goal.create confirm requires sole create_goal draftAction (residual 557)', () => {
    const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    expect(goal).toContain('Residual 557');
    expect(goal).toContain('productDraftCount !== 1');
    expect(goal).toContain("action.tool === 'create_goal'");
    const resumeIdx = goal.indexOf('async function resumeGoalAgentRun');
    expect(resumeIdx).toBeGreaterThan(-1);
    const resumeSlice = goal.slice(resumeIdx, resumeIdx + 4800);
    expect(resumeSlice).toContain('Residual 557');
    expect(resumeSlice).toContain('productDraftCount !== 1');
    expect(resumeSlice).toContain("action.tool === 'create_goal'");
    expect(resumeSlice).toContain("userDecision === 'confirm'");
    // Gate before Host lifecycle / confirm resume payload build.
    const gateIdx = resumeSlice.indexOf('productDraftCount !== 1');
    const hostIdx = resumeSlice.indexOf('dispatchHostProposalDecision');
    const payloadIdx = resumeSlice.indexOf('buildGoalAgentApprovalPayload');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(hostIdx).toBeGreaterThan(gateIdx);
    expect(payloadIdx).toBeGreaterThan(gateIdx);
    expect(helper).not.toContain('executeApproved');
  });

  it('goal session primary-task confirm requires sole create_task_template (residual 575)', () => {
    const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    expect(goal).toContain('Residual 575');
    expect(goal).toContain('isPrimaryTaskHostAgentRun');
    const resumeIdx = goal.indexOf('async function resumeGoalAgentRun');
    expect(resumeIdx).toBeGreaterThan(-1);
    const resumeSlice = goal.slice(resumeIdx, resumeIdx + 4800);
    expect(resumeSlice).toContain('Residual 575');
    expect(resumeSlice).toContain('isPrimaryTaskHostAgentRun');
    expect(resumeSlice).toContain("action.tool === 'create_task_template'");
    expect(resumeSlice).toContain("action.tool === 'create_goal'");
    expect(resumeSlice).toContain('productDraftCount !== 1');
    // Both product gates before Host lifecycle / confirm resume payload build.
    const taskToolIdx = resumeSlice.indexOf("action.tool === 'create_task_template'");
    const goalToolIdx = resumeSlice.indexOf("action.tool === 'create_goal'");
    const hostIdx = resumeSlice.indexOf('dispatchHostProposalDecision');
    const payloadIdx = resumeSlice.indexOf('buildGoalAgentApprovalPayload');
    expect(taskToolIdx).toBeGreaterThan(-1);
    expect(goalToolIdx).toBeGreaterThan(-1);
    expect(hostIdx).toBeGreaterThan(taskToolIdx);
    expect(hostIdx).toBeGreaterThan(goalToolIdx);
    expect(payloadIdx).toBeGreaterThan(taskToolIdx);
    expect(helper).not.toContain('executeApproved');
  });

  it('goal session primary-task confirm forwards Host-revised goalId (residual 583)', () => {
    const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(goal).toContain('Residual 583');
    expect(chatView).toContain('Residual 583');
    const resumeIdx = goal.indexOf('async function resumeGoalAgentRun');
    expect(resumeIdx).toBeGreaterThan(-1);
    const resumeSlice = goal.slice(resumeIdx, resumeIdx + 4200);
    expect(resumeSlice).toContain('Residual 583');
    // Must forward goalId into payload builder (not title/description alone).
    const payloadIdx = resumeSlice.indexOf('buildGoalAgentApprovalPayload');
    expect(payloadIdx).toBeGreaterThan(-1);
    const payloadCall = resumeSlice.slice(payloadIdx, payloadIdx + 450);
    expect(payloadCall).toContain('title: hostOptions?.title');
    expect(payloadCall).toContain('description: hostOptions?.description');
    expect(payloadCall).toContain('goalId: hostOptions?.goalId');
    // buildGoalAgentApprovalPayload applies goalId only on primary-task via applyHostTaskPatch.
    const buildIdx = goal.indexOf('function buildGoalAgentApprovalPayload');
    expect(buildIdx).toBeGreaterThan(-1);
    const buildSlice = goal.slice(buildIdx, buildIdx + 1200);
    expect(buildSlice).toContain('applyHostTaskPatchToAgentActions');
    expect(buildSlice).toContain('goalId: hostOptions?.goalId');
    // Host panel approve passes goalId on both goal-source and goal-session task paths.
    const approveIdx = chatView.indexOf('async function handleHostProposalApprove');
    expect(approveIdx).toBeGreaterThan(-1);
    const approveSlice = chatView.slice(approveIdx, approveIdx + 7500);
    expect(approveSlice).toContain('goalId: payload.patch.goalId ?? payload.item.goalId');
    expect(approveSlice).toContain('confirmGoalAgentRun');
    expect(approveSlice).toContain('isHostPanelGoalSessionProductOwned');
    expect(helper).not.toContain('executeApproved');
    expect(goal).not.toContain('executeApproved');
  });


  it('Host workbench focus/proposal builders use primary-task exclusive kind (residual 585)', () => {
    expect(helper).toContain('Residual 585');
    expect(helper).toContain('isPrimaryTaskHostAgentRun');
    // Focus kind selection uses primary-task exclusive, not bare isTaskShaped.
    const focusIdx = helper.indexOf('export function resolveHostWorkbenchFocusFromAgentRun');
    expect(focusIdx).toBeGreaterThan(-1);
    const focusSlice = helper.slice(focusIdx, focusIdx + 1200);
    expect(focusSlice).toContain('isPrimaryTaskHostAgentRun(result)');
    expect(focusSlice).toContain("kind = 'task.create'");
    expect(focusSlice).toContain("kind = 'goal.create'");
    expect(focusSlice).not.toContain('isTaskShapedHostAgentRun(result)');
    // Reopen receipt routing also exclusive primary-task.
    const reopenIdx = helper.indexOf('export function resolveHostWorkbenchReopenFromAgentRun');
    expect(reopenIdx).toBeGreaterThan(-1);
    const reopenSlice = helper.slice(reopenIdx, reopenIdx + 1600);
    expect(reopenSlice).toContain('isPrimaryTaskHostAgentRun(result)');
    expect(reopenSlice).toContain('primaryTask');
    expect(reopenSlice).not.toContain('isTaskShapedHostAgentRun(result)');
    // Proposal/receipt builders internalize exclusive live workbench promotion.
    const pendingIdx = helper.indexOf('export function buildPendingHostProposalItems');
    const receiptIdx = helper.indexOf('export function buildHostExecutionReceiptItems');
    expect(pendingIdx).toBeGreaterThan(-1);
    expect(receiptIdx).toBeGreaterThan(-1);
    // Residual 613 comments grow builder headers — keep exclusive promote in slice.
    const pendingSlice = helper.slice(pendingIdx, pendingIdx + 1600);
    const receiptSlice = helper.slice(receiptIdx, receiptIdx + 1600);
    expect(pendingSlice).toContain('resolveLiveHostWorkbenchAgentRuns');
    expect(receiptSlice).toContain('resolveLiveHostWorkbenchAgentRuns');
    expect(helper).not.toContain('executeApproved');
  });


  it('goal session Host lifecycle kind is task.create for primary-task (residual 587)', () => {
    const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    expect(goal).toContain('Residual 587');
    const resumeIdx = goal.indexOf('async function resumeGoalAgentRun');
    expect(resumeIdx).toBeGreaterThan(-1);
    const resumeSlice = goal.slice(resumeIdx, resumeIdx + 4800);
    expect(resumeSlice).toContain('Residual 587');
    expect(resumeSlice).toContain('hostProposalKind');
    expect(resumeSlice).toContain('isPrimaryTaskHostAgentRun(goalAgentRun.value)');
    expect(resumeSlice).toContain("? 'task.create'");
    expect(resumeSlice).toContain(": 'goal.create'");
    // dispatchHostProposalDecision must receive hostProposalKind, not a bare goal.create literal alone.
    const dispatchIdx = resumeSlice.indexOf('dispatchHostProposalDecision');
    expect(dispatchIdx).toBeGreaterThan(-1);
    const dispatchCall = resumeSlice.slice(dispatchIdx, dispatchIdx + 450);
    expect(dispatchCall).toContain('kind: hostProposalKind');
    expect(dispatchCall).not.toMatch(/kind:\s*'goal\.create'/);
    // Host panel primary-task path still uses payload.item.kind (task.create after exclusive).
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    const approveIdx = chatView.indexOf('async function handleHostProposalApprove');
    const approveSlice = chatView.slice(approveIdx, approveIdx + 3500);
    expect(approveSlice).toContain('kind: payload.item.kind');
    expect(helper).not.toContain('executeApproved');
    expect(goal).not.toContain('executeApproved');
  });


  it('dual-mirrors primary-task goal session settle into exclusive task lane (residual 589)', () => {
    expect(helper).toContain('Residual 589');
    expect(helper).toContain('shouldDualMirrorPrimaryTaskGoalSession');
    expect(helper).toContain('nextDualMirroredTaskAgentRun');
    const dualIdx = helper.indexOf('export function shouldDualMirrorPrimaryTaskGoalSession');
    expect(dualIdx).toBeGreaterThan(-1);
    const dualSlice = helper.slice(dualIdx, dualIdx + 900);
    expect(dualSlice).toContain("agentType === 'task.create'");
    expect(dualSlice).toContain('isPrimaryTaskHostAgentRun(result)');
    const nextIdx = helper.indexOf('export function nextDualMirroredTaskAgentRun');
    expect(nextIdx).toBeGreaterThan(-1);
    const nextSlice = helper.slice(nextIdx, nextIdx + 1200);
    expect(nextSlice).toContain('shouldDualMirrorPrimaryTaskGoalSession(goal)');
    expect(nextSlice).toContain("agentType === 'task.create'");
    // Chat view watches goal session and re-mirrors exclusive task lane.
    const chatView = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatView).toContain('Residual 589');
    expect(chatView).toContain('nextDualMirroredTaskAgentRun');
    expect(chatView).toContain('shouldDualMirrorPrimaryTaskGoalSession');
    expect(chatView).toContain('goalWorkflow.goalAgentRun.value');
    expect(helper).not.toContain('executeApproved');
    expect(chatView).not.toContain('executeApproved');
  });

  it('process-local task.create precedes dual-mirror overwrite (residual 591)', () => {
    expect(helper).toContain('Residual 591');
    const nextIdx = helper.indexOf('export function nextDualMirroredTaskAgentRun');
    expect(nextIdx).toBeGreaterThan(-1);
    const nextSlice = helper.slice(nextIdx, nextIdx + 1500);
    // Residual 591: process-local gate must run before dual-mirror goal return.
    const localIdx = nextSlice.indexOf("agentType === 'task.create'");
    const dualIdx = nextSlice.indexOf('shouldDualMirrorPrimaryTaskGoalSession(goal)');
    expect(localIdx).toBeGreaterThan(-1);
    expect(dualIdx).toBeGreaterThan(-1);
    expect(localIdx).toBeLessThan(dualIdx);
    expect(nextSlice).toContain('Residual 591');
    expect(helper).not.toContain('executeApproved');
  });

  it('session restore dual-mirrors exclusive task before focus (residual 593/601)', () => {
    expect(helper).toContain('Residual 593');
    const focusIdx = helper.indexOf('export function resolveHostWorkbenchFocusFromSessionRuns');
    expect(focusIdx).toBeGreaterThan(-1);
    const focusSlice = helper.slice(Math.max(0, focusIdx - 700), focusIdx + 1400);
    // Residual 601: focus uses exclusive-only (dual-mirror lives inside resolveLive).
    expect(focusSlice).toContain('resolveLiveHostWorkbenchAgentRuns');
    expect(focusSlice).toContain('Residual 601');
    expect(focusSlice).not.toContain('nextDualMirroredTaskAgentRun({');
    const chatView = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatView).toContain('Residual 593');
    const restoreIdx = chatView.indexOf('async function restoreWorkflowState');
    expect(restoreIdx).toBeGreaterThan(-1);
    const restoreSlice = chatView.slice(restoreIdx, restoreIdx + 1800);
    expect(restoreSlice).toContain('nextDualMirroredTaskAgentRun');
    expect(restoreSlice).toContain('await refreshRestoredAgentRun');
    expect(restoreSlice).toContain('noteAgentRun: noteWorkflow.noteAgentRun.value');
    // dual-mirror re-apply after refresh
    const refreshIdx = restoreSlice.indexOf('await refreshRestoredAgentRun');
    const dualRestoreIdx = restoreSlice.indexOf('nextDualMirroredTaskAgentRun');
    expect(refreshIdx).toBeGreaterThan(-1);
    expect(dualRestoreIdx).toBeGreaterThan(refreshIdx);
    expect(helper).not.toContain('executeApproved');
    expect(chatView).not.toContain('executeApproved');
  });

  it('live exclusive promote dual-mirrors before builders (residual 595)', () => {
    expect(helper).toContain('Residual 595');
    const liveIdx = helper.indexOf('export function resolveLiveHostWorkbenchAgentRuns');
    expect(liveIdx).toBeGreaterThan(-1);
    const liveSlice = helper.slice(liveIdx, liveIdx + 2000);
    expect(liveSlice).toContain('nextDualMirroredTaskAgentRun');
    expect(liveSlice).toContain('Residual 595');
    expect(liveSlice).toContain('dropStaleWhenGoalLeaves: false');
    expect(liveSlice).toContain('noteAgentRun: input.noteAgentRun');
    // dual-mirror before isPrimaryTaskHostAgentRun exclusive promote
    const dualIdx = liveSlice.indexOf('nextDualMirroredTaskAgentRun');
    const primaryIdx = liveSlice.indexOf('isPrimaryTaskHostAgentRun(dualMirroredTask)');
    expect(dualIdx).toBeGreaterThan(-1);
    expect(primaryIdx).toBeGreaterThan(dualIdx);
    // nextDualMirroredTaskAgentRun documents dropStale opt for builders vs watch.
    const nextIdx = helper.indexOf('export function nextDualMirroredTaskAgentRun');
    expect(nextIdx).toBeGreaterThan(-1);
    const nextSlice = helper.slice(nextIdx, nextIdx + 1800);
    expect(nextSlice).toContain('dropStaleWhenGoalLeaves');
    expect(helper).not.toContain('executeApproved');
  });


  it('Host panel ownership dual-mirrors exclusive before match (residual 597)', () => {
    expect(helper).toContain('Residual 597');
    const resolveIdx = helper.indexOf('export function resolveHostPanelOwnedProductRun');
    expect(resolveIdx).toBeGreaterThan(-1);
    const resolveSlice = helper.slice(resolveIdx, resolveIdx + 2200);
    expect(resolveSlice).toContain('resolveLiveHostWorkbenchAgentRuns');
    expect(resolveSlice).toContain('Residual 597');
    // exclusive promote before goal/task ownership match
    const exclusiveIdx = resolveSlice.indexOf('resolveLiveHostWorkbenchAgentRuns');
    const sourceGoalIdx = resolveSlice.indexOf("input.source === 'goal'");
    expect(exclusiveIdx).toBeGreaterThan(-1);
    expect(sourceGoalIdx).toBeGreaterThan(exclusiveIdx);
    // primary-task after exclusive still reachable from goal source
    expect(resolveSlice).toContain("agentType !== 'task.create'");
    expect(helper).not.toContain('executeApproved');
  });


  it('drops dual-mirror primary-task ghost beside normal goal (residual 599)', () => {
    expect(helper).toContain('Residual 599');
    const nextIdx = helper.indexOf('export function nextDualMirroredTaskAgentRun');
    expect(nextIdx).toBeGreaterThan(-1);
    // Include JSDoc above export (Residual 599 documents ghost drop).
    const nextSlice = helper.slice(Math.max(0, nextIdx - 900), nextIdx + 2400);
    expect(nextSlice).toContain('isDualMirroredPrimaryTask');
    expect(nextSlice).toContain('Residual 599');
    // Ghost drop when non-primary goal / knowledge present even for builders.
    expect(nextSlice).toContain('otherProductSessionPresent');
    expect(nextSlice).toContain("agentType !== 'task.create'");
    expect(helper).not.toContain('executeApproved');
  });

  it('drops dual-mirror ghost beside knowledge + focus exclusive-only (residual 601)', () => {
    expect(helper).toContain('Residual 601');
    const nextIdx = helper.indexOf('export function nextDualMirroredTaskAgentRun');
    expect(nextIdx).toBeGreaterThan(-1);
    const nextSlice = helper.slice(Math.max(0, nextIdx - 900), nextIdx + 2400);
    expect(nextSlice).toContain('noteAgentRun');
    expect(nextSlice).toContain('otherProductSessionPresent');
    expect(nextSlice).toContain('Boolean(note?.run)');
    const focusIdx = helper.indexOf('export function resolveHostWorkbenchFocusFromSessionRuns');
    const focusSlice = helper.slice(Math.max(0, focusIdx - 700), focusIdx + 1200);
    expect(focusSlice).toContain('Residual 601');
    expect(focusSlice).toContain('resolveLiveHostWorkbenchAgentRuns');
    // No pre-dual-mirror with default dropStale that wipes task-only exclusive.
    expect(focusSlice).not.toContain('nextDualMirroredTaskAgentRun({');
    const chatView = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatView).toContain('Residual 601');
    expect(chatView).toContain('noteAgentRun: noteWorkflow.noteAgentRun.value');
    expect(helper).not.toContain('executeApproved');
    expect(chatView).not.toContain('executeApproved');
  });


  it('knowledge classifier + AgentRun history session focus (residual 603)', () => {
    expect(helper).toContain('Residual 603');
    expect(helper).toContain('isHostPanelKnowledgeSessionProductOwned');
    const knIdx = helper.indexOf('export function isHostPanelKnowledgeSessionProductOwned');
    expect(knIdx).toBeGreaterThan(-1);
    const knSlice = helper.slice(knIdx, knIdx + 700);
    expect(knSlice).toContain("productTool === 'create_knowledge_note'");
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(chatView).toContain('isHostPanelKnowledgeSessionProductOwned');
    expect(chatView).toContain('Residual 603');
    // Approve/reject knowledge settle use classifier.
    const approveIdx = chatView.indexOf('async function handleHostProposalApprove');
    const approveSlice = chatView.slice(approveIdx, approveIdx + 4500);
    expect(approveSlice).toContain('isHostPanelKnowledgeSessionProductOwned(owned)');
    const rejectIdx = chatView.indexOf('async function handleHostProposalReject');
    const rejectSlice = chatView.slice(rejectIdx, rejectIdx + 3500);
    expect(rejectSlice).toContain('isHostPanelKnowledgeSessionProductOwned(owned)');
    // AgentRun history prefers session exclusive focus.
    const selectIdx = chatView.indexOf('async function selectAgentRun');
    expect(selectIdx).toBeGreaterThan(-1);
    const selectSlice = chatView.slice(selectIdx, selectIdx + 900);
    expect(selectSlice).toContain('resolveHostWorkbenchFocusFromSessionRuns');
    expect(selectSlice).toContain('resolveHostWorkbenchFocusFromAgentRun(result)');
    const sessionIdx = selectSlice.indexOf('resolveHostWorkbenchFocusFromSessionRuns');
    const singleIdx = selectSlice.indexOf('resolveHostWorkbenchFocusFromAgentRun(result)');
    expect(sessionIdx).toBeGreaterThan(-1);
    expect(singleIdx).toBeGreaterThan(sessionIdx);
    // Goal watch passes note for residual 601 ghost drop.
    const chatViewTs = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatViewTs).toContain('Residual 603');
    const watchIdx = chatViewTs.indexOf('// Residual 589: goal-session primary-task');
    expect(watchIdx).toBeGreaterThan(-1);
    const watchSlice = chatViewTs.slice(watchIdx, watchIdx + 900);
    expect(watchSlice).toContain('noteAgentRun: noteWorkflow.noteAgentRun.value');
    expect(helper).not.toContain('executeApproved');
    expect(chatView).not.toContain('executeApproved');
  });

  it('knowledge process-local edit revise via classifier (residual 605)', () => {
    const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(knowledge).toContain('Residual 605');
    expect(knowledge).toContain('reviseKnowledgeNoteAgentRun');
    expect(knowledge).toContain("userDecision: 'edit'");
    expect(knowledge).toContain('applyHostKnowledgePatchToAgentActions');
    // Sole product draft gate (residual 555/551 symmetry).
    const reviseIdx = knowledge.indexOf('async function reviseKnowledgeNoteAgentRun');
    expect(reviseIdx).toBeGreaterThan(-1);
    const reviseSlice = knowledge.slice(reviseIdx, reviseIdx + 2200);
    expect(reviseSlice).toContain("tool === 'create_knowledge_note'");
    expect(reviseSlice).toContain("status !== 'waiting_approval'");
    expect(reviseSlice).toContain("agentType !== 'knowledge.generate'");
    expect(reviseSlice).toContain('targetPath: hostOptions?.targetPath');
    expect(reviseSlice).toContain('contentMarkdown: hostOptions?.contentMarkdown');
    // Host panel revise settles knowledge via classifier + process-local edit.
    expect(chatView).toContain('reviseKnowledgeNoteAgentRun');
    expect(chatView).toContain('Residual 605');
    const hostReviseIdx = chatView.indexOf('async function handleHostProposalRevise');
    expect(hostReviseIdx).toBeGreaterThan(-1);
    const hostReviseSlice = chatView.slice(hostReviseIdx, hostReviseIdx + 4200);
    expect(hostReviseSlice).toContain('isHostPanelKnowledgeSessionProductOwned(owned)');
    expect(hostReviseSlice).toContain('reviseKnowledgeNoteAgentRun');
    // Classifier comment locks residual 605 revise path.
    expect(helper).toContain('Residual 603/605');
    expect(helper).toContain('Residual 605');
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
    expect(knowledge).not.toContain('executeApproved');
  });

  it('goal-session process-local edit revise via classifier (residual 607)', () => {
    const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(goal).toContain('Residual 607');
    expect(goal).toContain('reviseGoalAgentRun');
    expect(goal).toContain("userDecision: 'edit'");
    expect(goal).toContain('applyHostGoalPatchToAgentActions');
    expect(goal).toContain('applyHostTaskPatchToAgentActions');
    const reviseIdx = goal.indexOf('async function reviseGoalAgentRun');
    expect(reviseIdx).toBeGreaterThan(-1);
    const reviseSlice = goal.slice(reviseIdx, reviseIdx + 2800);
    expect(reviseSlice).toContain("status !== 'waiting_approval'");
    expect(reviseSlice).toContain("productTool = primaryTask ? 'create_task_template' : 'create_goal'");
    expect(reviseSlice).toContain('title: hostOptions?.title');
    expect(reviseSlice).toContain('description: hostOptions?.description');
    expect(reviseSlice).toContain('goalId: hostOptions?.goalId');
    // buildGoalAgentApprovalPayload also accepts edit for confirm symmetry.
    const payloadIdx = goal.indexOf('function buildGoalAgentApprovalPayload');
    expect(payloadIdx).toBeGreaterThan(-1);
    const payloadSlice = goal.slice(payloadIdx, payloadIdx + 900);
    expect(payloadSlice).toContain("userDecision !== 'edit'");
    expect(payloadSlice).toContain('Residual 607');
    // Host panel revise settles goal-session via classifier + process-local edit.
    expect(chatView).toContain('reviseGoalAgentRun');
    expect(chatView).toContain('Residual 607');
    const hostReviseIdx = chatView.indexOf('async function handleHostProposalRevise');
    expect(hostReviseIdx).toBeGreaterThan(-1);
    const hostReviseSlice = chatView.slice(hostReviseIdx, hostReviseIdx + 4800);
    expect(hostReviseSlice).toContain('isHostPanelGoalSessionProductOwned(owned)');
    expect(hostReviseSlice).toContain('reviseGoalAgentRun');
    // Classifier comment locks residual 607 revise path.
    expect(helper).toContain('Residual 581/607');
    expect(helper).toContain('Residual 607');
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
    expect(goal).not.toContain('executeApproved');
  });


  it('dirty approve process-local revise before goal/knowledge confirm (residual 609)', () => {
    expect(helper).toContain('Residual 609');
    expect(helper).toContain('shouldReviseKnowledgeSessionDraftBeforeConfirm');
    expect(helper).toContain('shouldReviseGoalSessionDraftBeforeConfirm');
    const knIdx = helper.indexOf('export function shouldReviseKnowledgeSessionDraftBeforeConfirm');
    expect(knIdx).toBeGreaterThan(-1);
    const knSlice = helper.slice(knIdx, knIdx + 700);
    expect(knSlice).toContain('isHostPanelKnowledgeSessionProductOwned');
    const goalIdx = helper.indexOf('export function shouldReviseGoalSessionDraftBeforeConfirm');
    expect(goalIdx).toBeGreaterThan(-1);
    const goalSlice = helper.slice(goalIdx, goalIdx + 700);
    expect(goalSlice).toContain('isHostPanelGoalSessionProductOwned');
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(chatView).toContain('shouldReviseKnowledgeSessionDraftBeforeConfirm');
    expect(chatView).toContain('shouldReviseGoalSessionDraftBeforeConfirm');
    expect(chatView).toContain('Residual 609');
    const approveIdx = chatView.indexOf('async function handleHostProposalApprove');
    expect(approveIdx).toBeGreaterThan(-1);
    const approveSlice = chatView.slice(approveIdx, approveIdx + 9000);
    // After Host decision, before product confirm.
    const decisionIdx = approveSlice.indexOf("decision: 'approve'");
    const goalReviseIdx = approveSlice.indexOf('shouldReviseGoalSessionDraftBeforeConfirm');
    const knReviseIdx = approveSlice.indexOf('shouldReviseKnowledgeSessionDraftBeforeConfirm');
    const confirmGoalIdx = approveSlice.indexOf('confirmGoalAgentRun');
    const createKnIdx = approveSlice.indexOf('createKnowledgeNoteFromConversation');
    expect(decisionIdx).toBeGreaterThan(-1);
    expect(goalReviseIdx).toBeGreaterThan(decisionIdx);
    expect(knReviseIdx).toBeGreaterThan(decisionIdx);
    expect(confirmGoalIdx).toBeGreaterThan(goalReviseIdx);
    expect(createKnIdx).toBeGreaterThan(knReviseIdx);
    expect(approveSlice).toContain('reviseGoalAgentRun');
    expect(approveSlice).toContain('reviseKnowledgeNoteAgentRun');
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });


  it('goal.create confirm/cancel and knowledge.write confirm require waiting_approval (residual 559)', () => {
    const goal = readFileSync(resolve(dir, 'useAIGoalWorkflow.ts'), 'utf8');
    const knowledge = readFileSync(resolve(dir, 'useAIKnowledgeNoteWorkflow.ts'), 'utf8');
    expect(goal).toContain('Residual 559');
    expect(knowledge).toContain('Residual 559');
    const resumeIdx = goal.indexOf('async function resumeGoalAgentRun');
    expect(resumeIdx).toBeGreaterThan(-1);
    const resumeSlice = goal.slice(resumeIdx, resumeIdx + 4200);
    expect(resumeSlice).toContain('Residual 559');
    expect(resumeSlice).toContain("run.status !== 'waiting_approval'");
    expect(resumeSlice).toContain("userDecision === 'confirm' || userDecision === 'cancel'");
    // Status gate before sole product draft gates and Host lifecycle.
    const statusIdx = resumeSlice.indexOf("run.status !== 'waiting_approval'");
    const productIdx = resumeSlice.indexOf('productDraftCount !== 1');
    const hostIdx = resumeSlice.indexOf('dispatchHostProposalDecision');
    expect(statusIdx).toBeGreaterThan(-1);
    expect(productIdx).toBeGreaterThan(statusIdx);
    expect(hostIdx).toBeGreaterThan(statusIdx);

    const createIdx = knowledge.indexOf('async function createKnowledgeNoteFromConversation');
    expect(createIdx).toBeGreaterThan(-1);
    const createSlice = knowledge.slice(createIdx, createIdx + 2400);
    expect(createSlice).toContain('Residual 559');
    expect(createSlice).toContain("run.status !== 'waiting_approval'");
    const kStatusIdx = createSlice.indexOf("run.status !== 'waiting_approval'");
    const kProductIdx = createSlice.indexOf('productDraftCount !== 1');
    const kHostIdx = createSlice.indexOf('dispatchHostProposalDecision');
    expect(kStatusIdx).toBeGreaterThan(-1);
    expect(kProductIdx).toBeGreaterThan(kStatusIdx);
    expect(kHostIdx).toBeGreaterThan(kStatusIdx);
    // Knowledge cancel already waiting_approval-only (residual 357).
    const cancelIdx = knowledge.indexOf('async function cancelKnowledgeNoteAgentRun');
    expect(cancelIdx).toBeGreaterThan(-1);
    expect(knowledge.slice(cancelIdx, cancelIdx + 600)).toContain("run.status !== 'waiting_approval'");
    expect(helper).not.toContain('executeApproved');
  });


  it('Host panel goal/knowledge approve gates waiting_approval + sole product draft before lifecycle (residual 561)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('canHostApproveProductAgentRun');
    expect(helper).toContain('Residual 561');
    expect(chatView).toContain('canHostApproveProductAgentRun');
    expect(chatView).toContain('Residual 561');
    const approveIdx = chatView.indexOf('async function handleHostProposalApprove');
    expect(approveIdx).toBeGreaterThan(-1);
    const approveSlice = chatView.slice(approveIdx, approveIdx + 3600);
    expect(approveSlice).toContain('canHostApproveProductAgentRun');
    expect(approveSlice).toContain('resolveHostPanelOwnedProductRun');
    expect(approveSlice).toContain('owned.productTool');
    // Gate before Host lifecycle approve decision.
    const gateIdx = approveSlice.indexOf('canHostApproveProductAgentRun');
    const decisionIdx = approveSlice.indexOf('dispatchHostProposalDecision');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(decisionIdx).toBeGreaterThan(gateIdx);
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });

  it('Host panel task.create approve gates waiting_approval + sole create_task_template before lifecycle (residual 563)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('Residual 563');
    expect(chatView).toContain('Residual 563');
    // Ownership maps task.create to create_task_template (residual 569 resolver).
    expect(helper).toContain("productTool: 'create_task_template'");
    expect(helper).toContain("agentType === 'task.create'");
    const approveIdx = chatView.indexOf('async function handleHostProposalApprove');
    expect(approveIdx).toBeGreaterThan(-1);
    const approveSlice = chatView.slice(approveIdx, approveIdx + 7000);
    expect(approveSlice).toContain('Residual 563');
    expect(approveSlice).toContain('resolveHostPanelOwnedProductRun');
    expect(approveSlice).toContain('owned.productTool');
    // Pure domain createTemplate fallback remains after gates (ungated when no session owner).
    expect(approveSlice).toContain('buildHostTaskCreateTemplateRequest');
    // Ownership resolve before Host lifecycle decision.
    const resolveIdx = approveSlice.indexOf('resolveHostPanelOwnedProductRun');
    const decisionIdx = approveSlice.indexOf('dispatchHostProposalDecision');
    expect(resolveIdx).toBeGreaterThan(-1);
    expect(decisionIdx).toBeGreaterThan(resolveIdx);
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });

  it('Host panel goal/knowledge/task reject gates waiting_approval before lifecycle (residual 565)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('canHostRejectProductAgentRun');
    expect(helper).toContain('Residual 565');
    expect(chatView).toContain('canHostRejectProductAgentRun');
    expect(chatView).toContain('Residual 565');
    const rejectIdx = chatView.indexOf('async function handleHostProposalReject');
    expect(rejectIdx).toBeGreaterThan(-1);
    const rejectSlice = chatView.slice(rejectIdx, rejectIdx + 3200);
    expect(rejectSlice).toContain('canHostRejectProductAgentRun');
    expect(rejectSlice).toContain("source === 'goal'");
    expect(rejectSlice).toContain("source === 'knowledge'");
    expect(rejectSlice).toContain("source === 'task'");
    // Gate before Host lifecycle reject decision.
    const gateIdx = rejectSlice.indexOf('canHostRejectProductAgentRun');
    const decisionIdx = rejectSlice.indexOf('dispatchHostProposalDecision');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(decisionIdx).toBeGreaterThan(gateIdx);
    // Orphan task client-settle path remains after gates.
    expect(rejectSlice).toContain('clientSettledHostProposalIds');
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });

  it('Host panel goal/knowledge/task revise gates waiting_approval before lifecycle (residual 567)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('canHostReviseProductAgentRun');
    expect(helper).toContain('Residual 567');
    expect(chatView).toContain('canHostReviseProductAgentRun');
    expect(chatView).toContain('Residual 567');
    const reviseIdx = chatView.indexOf('async function handleHostProposalRevise');
    expect(reviseIdx).toBeGreaterThan(-1);
    const reviseSlice = chatView.slice(reviseIdx, reviseIdx + 3200);
    expect(reviseSlice).toContain('canHostReviseProductAgentRun');
    expect(reviseSlice).toContain("source === 'goal'");
    expect(reviseSlice).toContain("source === 'knowledge'");
    expect(reviseSlice).toContain("source === 'task'");
    // Gate before Host lifecycle revise dispatch.
    const gateIdx = reviseSlice.indexOf('canHostReviseProductAgentRun');
    const dispatchIdx = reviseSlice.indexOf('dispatchHostProposalRevise');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(dispatchIdx).toBeGreaterThan(gateIdx);
    // Dirty-only revise and task process-local edit remain.
    expect(reviseSlice).toContain('!payload.dirty');
    expect(reviseSlice).toContain('reviseTaskAgentRun');
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });

  it('Host panel revise requires sole product draftAction before lifecycle (residual 573)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('Residual 573');
    expect(helper).toContain('canHostReviseProductAgentRun');
    expect(chatView).toContain('Residual 573');
    const reviseIdx = chatView.indexOf('async function handleHostProposalRevise');
    expect(reviseIdx).toBeGreaterThan(-1);
    const reviseSlice = chatView.slice(reviseIdx, reviseIdx + 3600);
    expect(reviseSlice).toContain('canHostReviseProductAgentRun');
    expect(reviseSlice).toContain('owned.productTool');
    expect(reviseSlice).toContain('productTool: owned.productTool');
    // Gate before Host lifecycle revise dispatch.
    const gateIdx = reviseSlice.indexOf('canHostReviseProductAgentRun');
    const dispatchIdx = reviseSlice.indexOf('dispatchHostProposalRevise');
    expect(gateIdx).toBeGreaterThan(-1);
    expect(dispatchIdx).toBeGreaterThan(gateIdx);
    // Helper signature requires productTool (approve residual 561 symmetry).
    const helperFn = helper.indexOf('export function canHostReviseProductAgentRun');
    expect(helperFn).toBeGreaterThan(-1);
    const helperSlice = helper.slice(helperFn, helperFn + 900);
    expect(helperSlice).toContain('productTool');
    expect(helperSlice).toContain('canHostApproveProductAgentRun');
    expect(helperSlice).toContain('Residual 573');
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });


  it('Host panel approve/reject/revise share resolveHostPanelOwnedProductRun ownership (residual 569)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('resolveHostPanelOwnedProductRun');
    expect(helper).toContain('Residual 569');
    expect(chatView).toContain('resolveHostPanelOwnedProductRun');
    expect(chatView).toContain('Residual 569');
    // All three Host panel lifecycle handlers resolve ownership through the shared helper.
    for (const fn of [
      'async function handleHostProposalApprove',
      'async function handleHostProposalReject',
      'async function handleHostProposalRevise',
    ]) {
      const fnIdx = chatView.indexOf(fn);
      expect(fnIdx).toBeGreaterThan(-1);
      const slice = chatView.slice(fnIdx, fnIdx + 2800);
      expect(slice).toContain('resolveHostPanelOwnedProductRun');
      // Gate / resolve before Host lifecycle decision or revise dispatch.
      const resolveIdx = slice.indexOf('resolveHostPanelOwnedProductRun');
      expect(resolveIdx).toBeGreaterThan(-1);
      if (fn.includes('Revise')) {
        expect(slice.indexOf('dispatchHostProposalRevise')).toBeGreaterThan(resolveIdx);
      } else {
        expect(slice.indexOf('dispatchHostProposalDecision')).toBeGreaterThan(resolveIdx);
      }
    }
    // Ownership map is product-tool explicit (no multi-index invent).
    expect(helper).toContain("productTool: 'create_goal'");
    expect(helper).toContain("productTool: 'create_knowledge_note'");
    expect(helper).toContain("productTool: 'create_task_template'");
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });

  it('Host panel ownership maps primary-task-shaped to create_task_template (residual 577)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('Residual 577');
    expect(helper).toContain('isPrimaryTaskHostAgentRun');
    expect(chatView).toContain('Residual 577');
    expect(chatView).toContain('liveHostWorkbenchAgentRuns.value.goalAgentRun');
    expect(chatView).toContain('liveHostWorkbenchAgentRuns.value.taskAgentRun');
    // Ownership resolve uses exclusive workbench lane inputs (not raw dual session fields alone).
    for (const fn of [
      'async function handleHostProposalApprove',
      'async function handleHostProposalReject',
      'async function handleHostProposalRevise',
    ]) {
      const fnIdx = chatView.indexOf(fn);
      expect(fnIdx).toBeGreaterThan(-1);
      const slice = chatView.slice(fnIdx, fnIdx + 2800);
      expect(slice).toContain('resolveHostPanelOwnedProductRun');
      expect(slice).toContain('liveHostWorkbenchAgentRuns.value.goalAgentRun');
      expect(slice).toContain('liveHostWorkbenchAgentRuns.value.taskAgentRun');
      // Prefer workbench lane over raw goalAgentRun.value dual path.
      expect(slice).not.toContain('goalAgentRun: goalAgentRun.value');
    }
    // Helper maps primary-task-shaped → create_task_template.
    const resolveIdx = helper.indexOf('export function resolveHostPanelOwnedProductRun');
    expect(resolveIdx).toBeGreaterThan(-1);
    const resolveSlice = helper.slice(resolveIdx, resolveIdx + 2200);
    expect(resolveSlice).toContain('Residual 577');
    expect(resolveSlice).toContain('isPrimaryTaskHostAgentRun');
    expect(resolveSlice).toContain("productTool: 'create_task_template'");
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });

  it('Host panel primary-task-shaped settlement uses goal session confirm/cancel (residual 579)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('Residual 579');
    expect(chatView).toContain('Residual 579');
    // Residual 581 classifiers encode residual 579 primary-task → goal session rule.
    expect(helper).toContain('isHostPanelGoalSessionProductOwned');
    expect(helper).toContain('isHostPanelProcessLocalTaskCreateOwned');
    // Approve: goal-session product → confirmGoalAgentRun (not process-local complete alone).
    const approveIdx = chatView.indexOf('async function handleHostProposalApprove');
    expect(approveIdx).toBeGreaterThan(-1);
    const approveSlice = chatView.slice(approveIdx, approveIdx + 7500);
    expect(approveSlice).toContain('isHostPanelGoalSessionProductOwned');
    expect(approveSlice).toContain('confirmGoalAgentRun');
    expect(approveSlice).toContain('isHostPanelProcessLocalTaskCreateOwned');
    expect(approveSlice).toContain('completeTaskAgentRun');
    // Reject: process-local cancelTask vs goal-session cancelGoal via classifiers.
    const rejectIdx = chatView.indexOf('async function handleHostProposalReject');
    expect(rejectIdx).toBeGreaterThan(-1);
    const rejectSlice = chatView.slice(rejectIdx, rejectIdx + 4500);
    expect(rejectSlice).toContain('isHostPanelProcessLocalTaskCreateOwned');
    expect(rejectSlice).toContain('cancelTaskAgentRun');
    expect(rejectSlice).toContain('isHostPanelGoalSessionProductOwned');
    expect(rejectSlice).toContain('cancelGoalAgentRun');
    // Revise process-local only via process-local classifier.
    const reviseIdx = chatView.indexOf('async function handleHostProposalRevise');
    const reviseSlice = chatView.slice(reviseIdx, reviseIdx + 3600);
    expect(reviseSlice).toContain('isHostPanelProcessLocalTaskCreateOwned');
    expect(reviseSlice).toContain('reviseTaskAgentRun');
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });

  it('Host panel settlement classifiers shared by approve/reject/revise (residual 581)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('isHostPanelProcessLocalTaskCreateOwned');
    expect(helper).toContain('isHostPanelGoalSessionProductOwned');
    expect(helper).toContain('Residual 581');
    expect(chatView).toContain('isHostPanelProcessLocalTaskCreateOwned');
    expect(chatView).toContain('isHostPanelGoalSessionProductOwned');
    // All three handlers use shared classifiers (no dual agentType re-branch invent).
    for (const fn of [
      'async function handleHostProposalApprove',
      'async function handleHostProposalReject',
      'async function handleHostProposalRevise',
    ]) {
      const fnIdx = chatView.indexOf(fn);
      expect(fnIdx).toBeGreaterThan(-1);
      const slice = chatView.slice(fnIdx, fnIdx + 9500);
      if (fn.includes('Revise')) {
        expect(slice).toContain('isHostPanelProcessLocalTaskCreateOwned');
      } else {
        expect(slice).toContain('isHostPanelProcessLocalTaskCreateOwned');
        expect(slice).toContain('isHostPanelGoalSessionProductOwned');
      }
    }
    // Helper predicates are exclusive for task.create vs primary-task-shaped.
    const processIdx = helper.indexOf('export function isHostPanelProcessLocalTaskCreateOwned');
    const goalIdx = helper.indexOf('export function isHostPanelGoalSessionProductOwned');
    expect(processIdx).toBeGreaterThan(-1);
    expect(goalIdx).toBeGreaterThan(-1);
    expect(helper.slice(processIdx, processIdx + 700)).toContain("agentType === 'task.create'");
    expect(helper.slice(goalIdx, goalIdx + 900)).toContain("agentType !== 'task.create'");
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });




  it('Host panel settlement reuses resolveHostPanelOwnedProductRun ownership (residual 571)', () => {
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(helper).toContain('Residual 571');
    expect(chatView).toContain('Residual 571');
    expect(chatView).toContain('Residual 569/571');
    // Approve/reject/revise hoist owned for gate + settlement (no dual re-resolve).
    for (const fn of [
      'async function handleHostProposalApprove',
      'async function handleHostProposalReject',
      'async function handleHostProposalRevise',
    ]) {
      const fnIdx = chatView.indexOf(fn);
      expect(fnIdx).toBeGreaterThan(-1);
      // Residual 603: approve handler grew with knowledge classifier — keep full settlement body.
      const slice = chatView.slice(fnIdx, fnIdx + 11000);
      expect(slice).toContain('resolveHostPanelOwnedProductRun');
      // Residual 581: settlement uses shared classifiers (not dual productTool re-branch invent).
      expect(slice).toContain('isHostPanelProcessLocalTaskCreateOwned');
      // Settlement paths bind ownership classifiers — not dual isTaskAgentType/liveHost re-resolve.
      expect(slice).not.toContain(
        'liveHostWorkbenchAgentRuns.value.taskAgentRun?.run.agentType',
      );
    }
    // Task approve settlement: goal-session product confirms goal; process-local completes.
    const approveIdx = chatView.indexOf('async function handleHostProposalApprove');
    const approveSlice = chatView.slice(approveIdx, approveIdx + 11000);
    expect(approveSlice).toContain('isHostPanelGoalSessionProductOwned');
    expect(approveSlice).toContain('isHostPanelProcessLocalTaskCreateOwned');
    expect(approveSlice).toContain('isTaskAgentType');
    expect(approveSlice).toContain('confirmGoalAgentRun');
    expect(approveSlice).toContain('completeTaskAgentRun');
    // Reject settlement mirrors shared ownership classifiers.
    const rejectIdx = chatView.indexOf('async function handleHostProposalReject');
    const rejectSlice = chatView.slice(rejectIdx, rejectIdx + 4500);
    expect(rejectSlice).toContain('isHostPanelProcessLocalTaskCreateOwned');
    expect(rejectSlice).toContain('isHostPanelGoalSessionProductOwned');
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });






  it('task.create process-local store conversation list trims (residual 509)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    expect(store).toContain('matchesHostTaskCreateConversation');
    expect(store).toContain('resolveTaskCreateConversationId');
    expect(store).toContain('Residual 509');
    expect(store).toContain('matchesHostTaskCreateConversation(run.conversationId, queryConversationId)');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create process-local store thread binding trims (residual 511)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    expect(store).toContain('matchesHostTaskCreateThread');
    expect(store).toContain('resolveTaskCreateThreadId');
    expect(store).toContain('HOST_TASK_CREATE_RUN_STORE_REQUIRES_THREAD_MESSAGE');
    expect(store).toContain('Residual 511');
    expect(store).toContain('matchesHostTaskCreateThread(existing.run.threadId, normalized.run.threadId)');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create process-local store conversation upsert normalizes (residual 513)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    expect(store).toContain('HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE');
    expect(store).toContain('resolveTaskCreateConversationId');
    expect(store).toContain('Residual 513');
    expect(store).toContain('const conversationId = resolveTaskCreateConversationId(result.run.conversationId)');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create process-local store identity upsert normalizes (residual 515)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    expect(store).toContain('HOST_TASK_CREATE_RUN_STORE_REQUIRES_IDENTITY_MESSAGE');
    expect(store).toContain('resolveTaskCreateIdentityId');
    expect(store).toContain('Residual 515');
    expect(store).toContain('const identityId = resolveTaskCreateIdentityId(result.run.identityId)');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create listRuns remote ownership trims identity (residual 517)', () => {
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(runtime).toContain('matchesHostTaskCreateIdentity');
    expect(runtime).toContain('Residual 517');
    expect(runtime).toContain(
      'matchesHostTaskCreateIdentity(run.identityId, cx.identityId)',
    );
    // Ownership helper shares the same trim matcher.
    expect(runtime).toContain('matchesHostTaskCreateIdentity(result.run.identityId, identityId)');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create draft title/goalId reads create_task_template only (residual 519)', () => {
    const helper = readFileSync(resolve(dir, 'hostProposalLifecycle.ts'), 'utf8');
    expect(helper).toContain('firstCreateTaskTemplateAction');
    expect(helper).toContain('Residual 519');
    // taskDraftTitle / taskDraftGoalId use create_task_template finder — not blind pending[0].
    const titleIdx = helper.indexOf('function taskDraftTitle');
    const goalIdx = helper.indexOf('function taskDraftGoalId');
    expect(titleIdx).toBeGreaterThan(-1);
    expect(goalIdx).toBeGreaterThan(-1);
    const titleSlice = helper.slice(titleIdx, titleIdx + 900);
    const goalSlice = helper.slice(goalIdx, goalIdx + 700);
    expect(titleSlice).toContain('firstCreateTaskTemplateAction(run)');
    expect(titleSlice).not.toContain('pendingActions[0] ?? run.state.approvedActions[0]');
    expect(goalSlice).toContain('firstCreateTaskTemplateAction(run)');
    expect(goalSlice).not.toContain('pendingActions[0] ?? run.state.approvedActions[0]');
    expect(helper).not.toContain('executeApproved');
  });

  it('knowledge.write draft path/markdown reads create_knowledge_note only (residual 521)', () => {
    expect(helper).toContain('firstCreateKnowledgeNoteAction');
    expect(helper).toContain('Residual 521');
    const pathIdx = helper.indexOf('function knowledgeDraftTargetPath');
    const mdIdx = helper.indexOf('function knowledgeDraftMarkdown');
    expect(pathIdx).toBeGreaterThan(-1);
    expect(mdIdx).toBeGreaterThan(-1);
    const pathSlice = helper.slice(pathIdx, pathIdx + 700);
    const mdSlice = helper.slice(mdIdx, mdIdx + 600);
    expect(pathSlice).toContain('firstCreateKnowledgeNoteAction(run)');
    expect(pathSlice).not.toContain('pendingActions[0] ?? run.state.approvedActions[0]');
    expect(mdSlice).toContain('firstCreateKnowledgeNoteAction(run)');
    expect(mdSlice).not.toContain('pendingActions[0] ?? run.state.approvedActions[0]');
    expect(helper).not.toContain('executeApproved');
  });

  it('knowledge.write draft title reads create_knowledge_note only (residual 531)', () => {
    expect(helper).toContain('Residual 531');
    const titleIdx = helper.indexOf('function knowledgeDraftTitle');
    expect(titleIdx).toBeGreaterThan(-1);
    const titleSlice = helper.slice(titleIdx, titleIdx + 900);
    expect(titleSlice).toContain('firstCreateKnowledgeNoteAction(run)');
    expect(titleSlice).toContain("['title']");
    expect(titleSlice).not.toContain('pendingActions[0] ?? run.state.approvedActions[0]');
  });

  it('goal.create draft title/description reads create_goal only (residual 523)', () => {
    expect(helper).toContain('firstCreateGoalAction');
    expect(helper).toContain('Residual 523');
    const titleIdx = helper.indexOf('function goalDraftTitle');
    const descIdx = helper.indexOf('function goalDraftDescription');
    expect(titleIdx).toBeGreaterThan(-1);
    expect(descIdx).toBeGreaterThan(-1);
    const titleSlice = helper.slice(titleIdx, titleIdx + 700);
    const descSlice = helper.slice(descIdx, descIdx + 600);
    expect(titleSlice).toContain('firstCreateGoalAction(run)');
    expect(titleSlice).not.toContain('pendingActions[0] ?? run.state.approvedActions[0]');
    expect(descSlice).toContain('firstCreateGoalAction(run)');
    expect(descSlice).not.toContain('pendingActions[0] ?? run.state.approvedActions[0]');
    expect(helper).not.toContain('executeApproved');
  });

  it('workbench summary rationale reads product-lane tool only (residual 525)', () => {
    expect(helper).toContain('Residual 525');
    const fnIdx = helper.indexOf('function firstPendingRationale');
    expect(fnIdx).toBeGreaterThan(-1);
    const fnSlice = helper.slice(fnIdx, fnIdx + 900);
    expect(fnSlice).toContain('productTool');
    // Residual 549: rationale delegates to soleProductDraftAction (no multi-find invent).
    expect(fnSlice).toContain('soleProductDraftAction(run, productTool)');
    expect(fnSlice).not.toContain('pendingActions[0] ?? run.state.approvedActions[0]');
    // Call sites pass lane product tools — not bare firstPendingRationale(run).
    expect(helper).toContain("firstPendingRationale(goalRun, 'create_goal')");
    expect(helper).toContain("firstPendingRationale(noteRun, 'create_knowledge_note')");
    expect(helper).toContain("firstPendingRationale(taskRun, 'create_task_template')");
  });

  it('workbench pendingActionCount counts product-lane tool only (residual 527)', () => {
    expect(helper).toContain('Residual 527');
    const fnIdx = helper.indexOf('function pendingActionCount');
    expect(fnIdx).toBeGreaterThan(-1);
    const fnSlice = helper.slice(fnIdx, fnIdx + 900);
    expect(fnSlice).toContain('productTool');
    expect(fnSlice).toContain('candidate.tool === productTool');
    expect(fnSlice).not.toContain('return run.state.pendingActions.length');
    expect(fnSlice).not.toContain('return run.state.approvedActions.length');
    expect(helper).toContain("pendingActionCount(goalRun, 'create_goal')");
    expect(helper).toContain("pendingActionCount(noteRun, 'create_knowledge_note')");
    expect(helper).toContain("pendingActionCount(taskRun, 'create_task_template')");
  });

  it('receipt primaryEntityId prefers product-lane executed tool only (residual 529)', () => {
    expect(helper).toContain('Residual 529');
    const fnIdx = helper.indexOf('function summarizeExecutedActions');
    expect(fnIdx).toBeGreaterThan(-1);
    const fnSlice = helper.slice(fnIdx, fnIdx + 1400);
    expect(fnSlice).toContain('productTool');
    expect(fnSlice).toContain('action.tool === productTool');
    expect(fnSlice).not.toContain('if (!primaryEntityId && entityIds[0])');
    expect(fnSlice).not.toContain("action.tool === 'create_goal' || action.tool === 'create_knowledge_note'");
    expect(helper).toContain("summarizeExecutedActions(goalRun, 'create_goal')");
    expect(helper).toContain("summarizeExecutedActions(noteRun, 'create_knowledge_note')");
    expect(helper).toContain("summarizeExecutedActions(taskRun, 'create_task_template')");
  });

  it('receipt summary excludes cross-lane foreign tools (residual 533)', () => {
    expect(helper).toContain('Residual 533');
    expect(helper).toContain('isCrossLaneForeignTool');
    const fnIdx = helper.indexOf('function isCrossLaneForeignTool');
    expect(fnIdx).toBeGreaterThan(-1);
    const fnSlice = helper.slice(fnIdx, fnIdx + 900);
    expect(fnSlice).toContain("tool === 'create_task_template'");
    expect(fnSlice).toContain("tool === 'create_knowledge_note'");
    const sumIdx = helper.indexOf('function summarizeExecutedActions');
    expect(sumIdx).toBeGreaterThan(-1);
    const sumSlice = helper.slice(sumIdx, sumIdx + 1800);
    expect(sumSlice).toContain('isCrossLaneForeignTool(productTool, action.tool)');
    expect(sumSlice).toContain('continue');
  });

  it('receipt summary error uses same-lane failed action only (residual 535)', () => {
    expect(helper).toContain('Residual 535');
    const sumIdx = helper.indexOf('function summarizeExecutedActions');
    expect(sumIdx).toBeGreaterThan(-1);
    const sumSlice = helper.slice(sumIdx, sumIdx + 3600);
    expect(sumSlice).toContain('firstFailedMessage');
    expect(sumSlice).toContain("line.status === 'failed'");
    expect(sumSlice).not.toContain('run.state.errors?.[0]');
    expect(sumSlice).not.toContain('const firstError = run.state.errors');
  });

  it('receipt ok requires product-lane executed on completed runs (residual 537)', () => {
    expect(helper).toContain('Residual 537');
    expect(helper).toContain('productLaneExecuted');
    const sumIdx = helper.indexOf('function summarizeExecutedActions');
    expect(sumIdx).toBeGreaterThan(-1);
    const sumSlice = helper.slice(sumIdx, sumIdx + 3600);
    expect(sumSlice).toContain('productLaneExecuted');
    expect(sumSlice).toContain("line.tool === productTool && line.status === 'executed'");
    expect(sumSlice).toContain('failedCount === 0 && productLaneExecuted');
    expect(sumSlice).not.toContain(
      "const ok = run.run.status === 'completed' && failedCount === 0;",
    );
  });

















  it('task.create client complete requires waiting_approval only (residual 489)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    // Host confirm already waiting_approval-only (residual 475).
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_REQUIRES_WAITING_APPROVAL_MESSAGE');
    expect(resume).toContain('Residual 475');
    // Client complete now double-gates waiting_approval (residual 489).
    expect(taskWorkflow).toContain('completeTaskAgentRun');
    expect(taskWorkflow).toContain('Residual 489');
    expect(taskWorkflow).toContain("run.run.status !== 'waiting_approval'");
    // completeTaskAgentRun body includes waiting_approval gate before templateId check.
    const completeIdx = taskWorkflow.indexOf('async function completeTaskAgentRun');
    expect(completeIdx).toBeGreaterThan(-1);
    const completeSlice = taskWorkflow.slice(completeIdx, completeIdx + 900);
    expect(completeSlice).toContain("run.run.status !== 'waiting_approval'");
    expect(completeSlice).toContain('Residual 489');
    expect(helper).not.toContain('executeApproved');
  });



  it('task.create edit/confirm tool gates use named constants (residual 491)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    expect(resume).toContain('HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_ACTIONS_MESSAGE');
    expect(resume).toContain('HOST_TASK_CREATE_EDIT_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE');
    expect(resume).toContain('HOST_TASK_CREATE_CONFIRM_REQUIRES_EXECUTED_STATUS_MESSAGE');
    expect(resume).toContain('Residual 491');
    // Product path throws use constants, not ad-hoc invent strings.
    expect(resume).toContain('throw new Error(HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_ACTIONS_MESSAGE)');
    expect(resume).toContain('throw new Error(HOST_TASK_CREATE_EDIT_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE)');
    expect(resume).toContain('throw new Error(HOST_TASK_CREATE_CONFIRM_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE)');
    expect(resume).toContain('throw new Error(HOST_TASK_CREATE_CONFIRM_REQUIRES_EXECUTED_STATUS_MESSAGE)');
    expect(helper).not.toContain('executeApproved');
  });


  it('task.create process-local store size bound (residual 447)', () => {
    const store = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
      ),
      'utf8',
    );
    expect(store).toContain('HOST_TASK_CREATE_RUN_STORE_MAX_ENTRIES');
    expect(store).toContain('pruneOldest');
    expect(store).toContain('maxEntries');
    expect(store).toContain('Residual 447');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create linked goal restore + client settlement isolation (residual 445)', () => {
    expect(helper).toContain('resolveLinkedGoalIdFromTaskAgentRun');
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(taskWorkflow).toContain('syncLinkedGoalFromTaskAgentRun');
    expect(taskWorkflow).toContain('resolveLinkedGoalIdFromTaskAgentRun');
    const chatViewTs = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatViewTs).toContain('syncLinkedGoalFromTaskAgentRun');
    expect(chatViewTs).toContain('Residual 445');
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(chatView).toContain('clientSettledHostProposalIds.value = []');
    expect(chatView).toContain('clientTaskHostReceipts.value = []');
    expect(chatView).toContain('Residual 445');
    expect(helper).not.toContain('executeApproved');
  });

  it('conversation restore Host workbench focus (residual 443)', () => {
    expect(helper).toContain('resolveHostWorkbenchFocusFromSessionRuns');
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(chatView).toContain('resolveHostWorkbenchFocusFromSessionRuns');
    expect(chatView).toContain('selectConversationBase');
    expect(chatView).toContain('Residual 443');
    // Residual 611: default auto-focus no longer uses raw items[0] alone.
    expect(chatView).toContain('resolveDefaultHostWorkbenchFocusProposalId');
    expect(helper).not.toContain('executeApproved');
  });

  it('default Host workbench focus prefers exclusive session (residual 611)', () => {
    expect(helper).toContain('Residual 611');
    expect(helper).toContain('resolveDefaultHostWorkbenchFocusProposalId');
    const fnIdx = helper.indexOf('export function resolveDefaultHostWorkbenchFocusProposalId');
    expect(fnIdx).toBeGreaterThan(-1);
    const fnSlice = helper.slice(fnIdx, fnIdx + 1800);
    expect(fnSlice).toContain('resolveHostWorkbenchFocusFromSessionRuns');
    expect(fnSlice).toContain('proposalItems');
    expect(fnSlice).toContain('receiptItems');
    // Session exclusive call before firstProposal/firstReceipt fallbacks.
    const sessionCallIdx = fnSlice.indexOf('const sessionFocus = resolveHostWorkbenchFocusFromSessionRuns');
    const firstProposalIdx = fnSlice.indexOf('const firstProposal = input.proposalItems');
    expect(sessionCallIdx).toBeGreaterThan(-1);
    expect(firstProposalIdx).toBeGreaterThan(sessionCallIdx);
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(chatView).toContain('resolveDefaultHostWorkbenchFocusProposalId');
    expect(chatView).toContain('Residual 611');
    // Auto-open watch uses helper (not sole hostProposalItems[0]).
    const watchIdx = chatView.indexOf('// Residual 371/379/443/611');
    expect(watchIdx).toBeGreaterThan(-1);
    const watchSlice = chatView.slice(watchIdx, watchIdx + 1200);
    expect(watchSlice).toContain('resolveDefaultHostWorkbenchFocusProposalId');
    expect(watchSlice).toContain('taskAgentRun: taskAgentRun.value');
    expect(watchSlice).toContain('goalAgentRun: goalAgentRun.value');
    expect(watchSlice).toContain('noteAgentRun: noteAgentRun.value');
    expect(watchSlice).not.toMatch(
      /focusedHostProposalId\.value\s*=\s*\n\s*hostProposalItems\.value\[0\]/,
    );
    expect(chatView).not.toContain('executeApproved');
    expect(helper).not.toContain('executeApproved');
  });

  it('Host proposal/receipt builders emit exclusive session order (residual 613)', () => {
    expect(helper).toContain('Residual 613');
    // Pending proposals: task block before goal before knowledge.
    const pendingIdx = helper.indexOf('export function buildPendingHostProposalItems');
    expect(pendingIdx).toBeGreaterThan(-1);
    const pendingSlice = helper.slice(pendingIdx, pendingIdx + 4200);
    expect(pendingSlice).toContain('Residual 613');
    const taskDecl = pendingSlice.indexOf('const taskRun = exclusive.taskAgentRun');
    const goalDecl = pendingSlice.indexOf('const goalRun = exclusive.goalAgentRun');
    const noteDecl = pendingSlice.indexOf('const noteRun = exclusive.noteAgentRun');
    expect(taskDecl).toBeGreaterThan(-1);
    expect(goalDecl).toBeGreaterThan(taskDecl);
    expect(noteDecl).toBeGreaterThan(goalDecl);
    // Receipts same exclusive priority.
    const receiptIdx = helper.indexOf('export function buildHostExecutionReceiptItems');
    expect(receiptIdx).toBeGreaterThan(-1);
    const receiptSlice = helper.slice(receiptIdx, receiptIdx + 5500);
    expect(receiptSlice).toContain('Residual 613');
    const rTask = receiptSlice.indexOf('const taskRun = exclusive.taskAgentRun');
    const rGoal = receiptSlice.indexOf('const goalRun = exclusive.goalAgentRun');
    const rNote = receiptSlice.indexOf('const noteRun = exclusive.noteAgentRun');
    expect(rTask).toBeGreaterThan(-1);
    expect(rGoal).toBeGreaterThan(rTask);
    expect(rNote).toBeGreaterThan(rGoal);
    expect(helper).not.toContain('executeApproved');
  });


  it('AgentRun history Host workbench focus for task.create reopen (residual 441)', () => {
    expect(helper).toContain('resolveHostWorkbenchFocusFromAgentRun');
    expect(helper).toContain('// Residual 441: process-local terminal task.create');
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(chatView).toContain('resolveHostWorkbenchFocusFromAgentRun');
    expect(chatView).toContain('focusedHostProposalId.value = focus?.proposalId');
    expect(chatView).toContain('Residual 381/441');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create process-local edit revise + idempotent terminal (residual 439)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    expect(resume).toContain("userDecision: 'edit'");
    expect(resume).toContain('idempotent terminal resume');
    expect(resume).toContain("status: 'waiting_approval'");
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(taskWorkflow).toContain('reviseTaskAgentRun');
    expect(taskWorkflow).toContain("userDecision: 'edit'");
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(chatView).toContain('reviseTaskAgentRun');
    expect(chatView).toContain('Residual 439');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create process-local cancel/complete resume (residual 437)', () => {
    const resume = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
      ),
      'utf8',
    );
    expect(resume).toContain('buildHostTaskCreateResumeResult');
    expect(resume).toContain("status: 'cancelled'");
    expect(resume).toContain("userDecision: 'cancel'");
    expect(resume).toContain("userDecision: 'confirm'");
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(runtime).toContain('buildHostTaskCreateResumeResult');
    expect(runtime).toContain('// Residual 437: process-local task.create cancel/complete settle');
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(taskWorkflow).toContain('cancelTaskAgentRun');
    expect(taskWorkflow).toContain('completeTaskAgentRun');
    expect(taskWorkflow).toContain("userDecision: 'cancel'");
    expect(taskWorkflow).toContain("userDecision: 'confirm'");
    const chatView = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(chatView).toContain('cancelTaskAgentRun');
    expect(chatView).toContain('completeTaskAgentRun');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create session restore + linked goal start (residual 433)', () => {
    const chatViewTs = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatViewTs).toContain('Residual 433: restore dedicated task.create session field');
    expect(chatViewTs).toContain('taskAgentRun.value?.run.runId');
    expect(chatViewTs).toContain("toolMode.value = 'task-create'");
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(taskWorkflow).toContain('linkedGoalId');
    expect(taskWorkflow).toContain('goalId');
    expect(taskWorkflow).toContain('setLinkedGoalId');
    const actionBar = readFileSync(
      resolve(dir, '../components/AIWorkflowActionBar.vue'),
      'utf8',
    );
    expect(actionBar).toContain('task-agent-linked-goal');
    expect(actionBar).toContain('setLinkedGoalId');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create product start path (residual 431)', () => {
    const taskWorkflow = readFileSync(resolve(dir, 'useAITaskWorkflow.ts'), 'utf8');
    expect(taskWorkflow).toContain("agentType: 'task.create'");
    expect(taskWorkflow).toContain('startTaskAgentRun');
    const chatViewTs = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatViewTs).toContain('taskWorkflow');
    expect(chatViewTs).toContain('useAITaskWorkflow');
    expect(chatViewTs).toContain('syncTaskAgentRunFromStart');
    const actionBar = readFileSync(
      resolve(dir, '../components/AIWorkflowActionBar.vue'),
      'utf8',
    );
    expect(actionBar).toContain('task-agent-start-run');
    expect(actionBar).toContain('startTaskAgentRun');
    const hostStart = readFileSync(
      resolve(
        dir,
        '../../../../../ai/src/server/infrastructure/runtime/host-task-create-start.ts',
      ),
      'utf8',
    );
    expect(hostStart).toContain('buildHostTaskCreateStartResult');
    expect(hostStart).toContain("agentType: 'task.create'");
    expect(hostStart).toContain("tool: 'create_task_template'");
    const runtime = readFileSync(
      resolve(dir, '../../../../../ai/src/server/infrastructure/runtime/ai-runtime.ts'),
      'utf8',
    );
    expect(runtime).toContain("agentType === 'task.create'");
    expect(runtime).toContain('buildHostTaskCreateStartResult');
    expect(helper).not.toContain('executeApproved');
  });

  it('task.create product toolMode + welcome/footer entry (residual 429)', () => {
    const types = readFileSync(resolve(dir, 'types.ts'), 'utf8');
    expect(types).toContain("'task-create'");
    expect(types).toContain("mode === 'task-create'");
    const chatViewTs = readFileSync(resolve(dir, 'useAIChatView.ts'), 'utf8');
    expect(chatViewTs).toContain("toolMode.value = 'task-create'");
    const messagePanel = readFileSync(
      resolve(dir, '../components/AIMessagePanel.vue'),
      'utf8',
    );
    expect(messagePanel).toContain("mode: 'task-create'");
    expect(messagePanel).toContain("ai-welcome-entry-");
    const footer = readFileSync(
      resolve(dir, '../components/AIFooterComposer.vue'),
      'utf8',
    );
    expect(footer).toContain('ai-chat-tool-task-create');
    expect(footer).toContain("'task-create'");
    const chatViewVue = readFileSync(resolve(dir, '../views/AIChatView.vue'), 'utf8');
    expect(chatViewVue).toContain("'task-create': 'aiAssistant.chatPage.shortcuts.taskCreate.prefill'");
    expect(chatViewVue).toContain("toolMode.value === 'task-create'");
    expect(helper).not.toContain('executeApproved');
  });
});
