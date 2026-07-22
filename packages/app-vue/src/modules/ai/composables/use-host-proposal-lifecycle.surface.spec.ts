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
    expect(helper).toContain('looksLikeTaskHostRun');
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
    const completeSlice = taskWorkflow.slice(completeIdx, completeIdx + 1600);
    // Residual 501: find create_task_template draft — not blind pendingActions[0].
    expect(completeSlice).toContain(".find((action) => action.tool === 'create_task_template')");
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
    const reviseSlice = taskWorkflow.slice(reviseIdx, reviseIdx + 1600);
    // Residual 507: find create_task_template draft — not blind source first-entry fallback.
    expect(reviseSlice).toContain(".find((action) => action.tool === 'create_task_template')");
    expect(reviseSlice).toContain('Residual 507');
    expect(reviseSlice).not.toContain('?? source[0]');
    expect(reviseSlice).not.toContain('source.find((action) => action.tool === \'create_task_template\') ?? source[0]');
    // Still waiting_approval double-gate (residual 481) and single approvedAction (475).
    expect(reviseSlice).toContain("run.run.status !== 'waiting_approval'");
    expect(reviseSlice).toContain('if (approvedActions.length !== 1) return');
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
    expect(fnSlice).toContain("candidate.tool === productTool");
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
    expect(chatView).toContain('hostProposalItems.value[0]?.proposalId');
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
