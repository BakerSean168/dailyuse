/**
 * Residual 405/417/421/423/425/427: ADR-035 cross-end multi-engine Host product E2E scaffold.
 *
 * Freezes the intended Web + Desktop product journey for multi-engine open chat
 * (DirectTurn + ReadonlyAnalysis), cancel_run stop, and timeline engine badges.
 *
 * This is scaffolding only:
 * - Not a Playwright/Electron full product E2E run
 * - Not real Pi process spawn
 * - Not real OAuth / GitHub fixture coverage
 *
 * Future cross-end runners should consume buildCrossEndMultiEngineProductJourney()
 * rather than inventing a parallel step list.
 */

export type CrossEndMultiEngineProductSurface = 'web' | 'desktop' | 'shared';

export type CrossEndMultiEngineProductTransport = 'http_sse' | 'ipc' | 'ui';

export type CrossEndMultiEngineProductStepStatus =
  | 'scaffolded'
  | 'implemented_unit'
  | 'external_blocked';

export type CrossEndMultiEngineProductStep = {
  id: string;
  surface: CrossEndMultiEngineProductSurface;
  transport: CrossEndMultiEngineProductTransport;
  title: string;
  /** Stable product selectors / command contracts for future E2E drivers. */
  contracts: readonly string[];
  status: CrossEndMultiEngineProductStepStatus;
  /** Why external_blocked, when applicable. */
  blockedReason?: string;
};

/**
 * Canonical residual 405 product journey for multi-engine Host isolation.
 * Order is intentional: profile → send → badge → switch profile → cancel.
 */
export function buildCrossEndMultiEngineProductJourney(): CrossEndMultiEngineProductStep[] {
  return [
    {
      id: 'ui.select_direct_turn',
      surface: 'shared',
      transport: 'ui',
      title: 'Select open-chat DirectTurn Host profile',
      contracts: [
        'ai-chat-execution-profile',
        'ai-chat-execution-profile-direct',
        'executionProfileId:direct_turn',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'web.send_direct_turn',
      surface: 'web',
      transport: 'http_sse',
      title: 'Web open chat via AssistantFacade HTTP SSE (direct_turn)',
      contracts: [
        'POST /ai/assistant/dispatch/sse',
        "type:'message'",
        'executionProfileId:direct_turn',
        'no identityId in client body',
        'run.started engine.direct_turn',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'desktop.send_direct_turn',
      surface: 'desktop',
      transport: 'ipc',
      title: 'Desktop open chat via AssistantFacade IPC stream (direct_turn)',
      contracts: [
        'AIChannels.ASSISTANT_DISPATCH_START',
        "type:'message'",
        'executionProfileId:direct_turn',
        'no identityId in client body',
        'run.started engine.direct_turn',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.timeline_engine_badge_direct',
      surface: 'shared',
      transport: 'ui',
      title: 'Timeline open-chat card shows DirectTurn engine badge',
      contracts: [
        'ai-host-timeline-artifact-strip',
        'ai-host-timeline-artifact-engine-',
        'data-engine-key=engine.direct_turn',
        'surface:open_chat',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.select_pi_readonly',
      surface: 'shared',
      transport: 'ui',
      title: 'Select open-chat ReadonlyAnalysis Host profile',
      contracts: [
        'ai-chat-execution-profile-readonly',
        'executionProfileId:pi_readonly',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'web.send_pi_readonly',
      surface: 'web',
      transport: 'http_sse',
      title: 'Web open chat via HTTP SSE (pi_readonly)',
      contracts: [
        'POST /ai/assistant/dispatch/sse',
        'executionProfileId:pi_readonly',
        'run.started engine.pi_readonly',
        'no process.pi_readonly_spike',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'desktop.send_pi_readonly',
      surface: 'desktop',
      transport: 'ipc',
      title: 'Desktop open chat via IPC (pi_readonly)',
      contracts: [
        'executionProfileId:pi_readonly',
        'run.started engine.pi_readonly',
        'no process.pi_readonly_spike',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.stop_cancel_run',
      surface: 'shared',
      transport: 'ui',
      title: 'Stop generating issues Host cancel_run with client-owned runId',
      contracts: [
        'ai-chat-stop-generating',
        "type:'cancel_run'",
        'client-owned runId',
        'run.cancelled',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'host.mid_turn_cancel',
      surface: 'shared',
      transport: 'ui',
      title: 'In-flight DirectTurn/ReadonlyAnalysis abort on cancel_run',
      contracts: [
        'message.completed status:aborted',
        'AssistantFacade cancel_run',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.conversation_switch_badge_memory',
      surface: 'shared',
      transport: 'ui',
      title: 'Open-chat engine badges restore after conversation switch (session memory)',
      contracts: [
        'openChatHostTurnMemory',
        'rememberOpenChatHostTurnsForConversation',
        'restoreOpenChatHostTurnsForConversation',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.timeline_surface_isolation',
      surface: 'shared',
      transport: 'ui',
      title: 'Host timeline open_chat vs AgentRun surface isolation audit',
      contracts: [
        'partitionHostTimelineArtifactsBySurface',
        'collectHostTimelineSurfaceIsolationViolations',
        'isolationOk',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.workbench_timeline_composition',
      surface: 'shared',
      transport: 'ui',
      title: 'AIChatView composes Host timeline via workbench helper',
      contracts: [
        'composeHostWorkbenchTimelineArtifacts',
        'hostWorkbenchTimeline',
        'openChatHostTurns',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.langgraph_diagnostic_sanitization',
      surface: 'shared',
      transport: 'ui',
      title: 'Goal workflow diagnostics sanitize LangGraph node.* labels',
      contracts: [
        'formatLangGraphVendorDiagnosticEventLabel',
        'workflow_step_completed',
        'no raw node.started UI label path',
        'diagnosticWorkflowStepTiming',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.task_create_proposal_receipt_lane',
      surface: 'shared',
      transport: 'ui',
      title: 'Host task.create live lane + product start + process-local store',
      contracts: [
        'taskAgentRun',
        "kind: 'task.create'",
        'hostReceiptKindTask',
        'agent_run.task_create',
        'resolveLiveHostWorkbenchAgentRuns',
        'applyHostTaskPatchToAgentActions',
        'buildHostTaskCreateTemplateRequest',
        'buildHostTaskClientExecutionReceipt',
        'settledProposalIds',
        'clientTaskReceipts',
        "agentType === 'task.create'",
        'taskAgentRun',
        // Residual 429: product toolMode + welcome/footer entry (no full Task Agent start).
        "'task-create'",
        'ai-chat-tool-task-create',
        "toolMode.value = 'task-create'",
        // Residual 431: product start foundation (TS Host start + client start button).
        'buildHostTaskCreateStartResult',
        'startTaskAgentRun',
        'task-agent-start-run',
        // Residual 433: session restore + optional linked goal on start.
        'restore dedicated task.create session field',
        'task-agent-linked-goal',
        'linkedGoalId',
        // Residual 435: process-local task.create run store for get/list restore.
        'taskCreateRunStore',
        'createHostTaskCreateRunStore',
        'taskCreateRunStore.upsert',
        // Residual 437: process-local cancel/complete resume + client settle.
        'buildHostTaskCreateResumeResult',
        'cancelTaskAgentRun',
        'completeTaskAgentRun',
        // Residual 439: process-local edit revise + idempotent terminal resume.
        'reviseTaskAgentRun',
        "userDecision: 'edit'",
        'idempotent terminal resume',
        // Residual 441: history reopen focuses Host proposal/receipt row.
        'resolveHostWorkbenchFocusFromAgentRun',
        'focusedHostProposalId.value = focus?.proposalId',
        // Residual 443: conversation restore focus + default first proposal/receipt.
        'resolveHostWorkbenchFocusFromSessionRuns',
        'selectConversationBase',
        'hostProposalItems.value[0]?.proposalId',
        // Residual 445: linked goal restore + client settlement isolation on switch.
        'resolveLinkedGoalIdFromTaskAgentRun',
        'syncLinkedGoalFromTaskAgentRun',
        'clientSettledHostProposalIds.value = []',
        // Residual 447: process-local task.create store size bound.
        'HOST_TASK_CREATE_RUN_STORE_MAX_ENTRIES',
        'pruneOldest',
        // Residual 449: process-local product journey (start/edit/cancel/confirm + identity).
        'host-task-create-product.journey',
        'start → edit → cancel',
        'start → confirm settle',
        // Residual 451: process-local runId identity binding (fail-closed takeover).
        'HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE',
        'already bound to another identity',
        // Residual 453: confirm requires client-owned executedActions settlement.
        'HOST_TASK_CREATE_CONFIRM_REQUIRES_CLIENT_SETTLEMENT_MESSAGE',
        'requires non-empty client executedActions settlement',
        // Residual 455: edit revise requires non-empty title.
        'HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_TITLE_MESSAGE',
        'requires a non-empty revised title',
        // Residual 457: conversation/thread runId binding + activeOnly isolation.
        'HOST_TASK_CREATE_RUN_ID_CONVERSATION_BOUND_MESSAGE',
        'HOST_TASK_CREATE_RUN_ID_THREAD_BOUND_MESSAGE',
        'already bound to another conversation',
        // Residual 459: dirty approve revises process-local draft before domain settle.
        'shouldReviseProcessLocalTaskDraftBeforeDomainSettle',
        'dirty approve must revise process-local draft',
        // Residual 461: start requires non-empty conversationId (session-bound).
        'HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE',
        'resolveTaskCreateConversationId',
        // Residual 463: confirm settlement title recoverable for reopen/receipt.
        'HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TITLE_MESSAGE',
        'resolveConfirmSettlementTitle',
        // Residual 465: confirm settlement template entity id for receipt deep-link.
        'HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TEMPLATE_ID_MESSAGE',
        'resolveConfirmSettlementTemplateId',
        // Residual 467: confirm settlement goalId must not rebind approved draft.
        'HOST_TASK_CREATE_CONFIRM_GOAL_REBIND_FORBIDDEN_MESSAGE',
        'resolveConfirmSettlementGoalId',
        // Residual 469: confirm settlement title must not rebind approved draft.
        'HOST_TASK_CREATE_CONFIRM_TITLE_REBIND_FORBIDDEN_MESSAGE',
        // Residual 471: confirm process-local draft only + single executed settlement.
        'HOST_TASK_CREATE_CONFIRM_REQUIRES_STORE_DRAFT_MESSAGE',
        'HOST_TASK_CREATE_CONFIRM_REQUIRES_SINGLE_EXECUTED_MESSAGE',
        'resolveConfirmStoreDraftActions',
        // Residual 473: edit requires exactly one create_task_template approvedAction.
        'HOST_TASK_CREATE_EDIT_REQUIRES_SINGLE_ACTION_MESSAGE',
        // Residual 475: confirm only from waiting_approval product status.
        'HOST_TASK_CREATE_CONFIRM_REQUIRES_WAITING_APPROVAL_MESSAGE',
        // Residual 477: cancel only from waiting_approval product status.
        'HOST_TASK_CREATE_CANCEL_REQUIRES_WAITING_APPROVAL_MESSAGE',
        // Residual 479: start requires non-empty title (no silent default invent).
        'HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE',
        // Residual 481: edit only from waiting_approval product status.
        'HOST_TASK_CREATE_EDIT_REQUIRES_WAITING_APPROVAL_MESSAGE',
        // Residual 483: start builder conversationId fail-closed (no silent null).
        'Residual 483',
        // Residual 485: start builder threadId fail-closed (trim non-empty).
        'HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE',
        'resolveTaskCreateThreadId',
        // Residual 493: start builder identityId fail-closed (ExecutionContext only).
        'HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE',
        'resolveTaskCreateIdentityId',
        // Residual 489: client complete only from waiting_approval (Host 475 symmetry).
        'Residual 489',
        'completeTaskAgentRun',
        // Residual 491: edit/confirm tool+empty-action named constants.
        'HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_ACTIONS_MESSAGE',
        'HOST_TASK_CREATE_EDIT_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE',
        'HOST_TASK_CREATE_CONFIRM_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE',
        'HOST_TASK_CREATE_CONFIRM_REQUIRES_EXECUTED_STATUS_MESSAGE',
        // Residual 495: resume agentType + unsupported decision + store agentType.
        'HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE',
        'HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE',
        'HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE',
        // Residual 497: start builder runId fail-closed (trim non-empty).
        'HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE',
        'resolveTaskCreateRunId',
        // Residual 499: start builder agentType task.create fail-closed.
        'HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE',
        // Residual 501: client complete settlement draft create_task_template only.
        'Residual 501',
        "action.tool === 'create_task_template'",
        // Residual 503: process-local store identity trim match + ownership trim.
        'matchesHostTaskCreateIdentity',
        'Residual 503',
        'ensureAgentRunOwnedByIdentity',
        // Residual 505: process-local store runId trim lookup (start 497 symmetry).
        'HOST_TASK_CREATE_RUN_STORE_REQUIRES_RUN_ID_MESSAGE',
        'Residual 505',
        // Residual 507: client revise draft create_task_template only (no source[0]).
        'Residual 507',
        'reviseTaskAgentRun',
        // Residual 509: process-local store conversationId trim list match.
        'matchesHostTaskCreateConversation',
        'Residual 509',
        // Residual 511: process-local store threadId trim binding (start 485 symmetry).
        'matchesHostTaskCreateThread',
        'HOST_TASK_CREATE_RUN_STORE_REQUIRES_THREAD_MESSAGE',
        'Residual 511',
        // Residual 513: process-local store conversationId upsert normalize + blank fail-closed.
        'HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE',
        'Residual 513',
        // Residual 515: process-local store identityId upsert normalize + blank fail-closed.
        'HOST_TASK_CREATE_RUN_STORE_REQUIRES_IDENTITY_MESSAGE',
        'Residual 515',
        // Residual 517: listRuns remote ownership uses matchesHostTaskCreateIdentity.
        'Residual 517',
        'matchesHostTaskCreateIdentity(run.identityId, cx.identityId)',
        // Residual 519: client task draft title/goalId create_task_template only.
        'Residual 519',
        'firstCreateTaskTemplateAction',
        // Residual 521: client knowledge draft path/markdown create_knowledge_note only.
        'Residual 521',
        'firstCreateKnowledgeNoteAction',
        // Residual 523: client goal draft title/description create_goal only.
        'Residual 523',
        'firstCreateGoalAction',
        // Residual 525: workbench summary product-lane tool rationale only.
        'Residual 525',
        "firstPendingRationale(goalRun, 'create_goal')",
        // Residual 527: workbench pendingActionCount product-lane tool only.
        'Residual 527',
        "pendingActionCount(goalRun, 'create_goal')",
        // Residual 529: receipt primaryEntityId product-lane executed tool only.
        'Residual 529',
        "summarizeExecutedActions(goalRun, 'create_goal')",
        // Residual 531: knowledge draft title create_knowledge_note only.
        'Residual 531',
        'function knowledgeDraftTitle',
        // Residual 533: receipt summary excludes cross-lane foreign tools.
        'Residual 533',
        'isCrossLaneForeignTool',
        // Residual 535: receipt summary same-lane failed action message only.
        'Residual 535',
        'firstFailedMessage',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'e2e.playwright_web_full',
      surface: 'web',
      transport: 'http_sse',
      title: 'Full Playwright Web multi-engine product E2E',
      contracts: ['apps/web/e2e multi-engine Host journey'],
      status: 'external_blocked',
      blockedReason: 'Requires live Web stack + auth fixture; not claimed green in residual 405',
    },
    {
      id: 'e2e.electron_desktop_full',
      surface: 'desktop',
      transport: 'ipc',
      title: 'Full Electron Desktop multi-engine product E2E',
      contracts: ['apps/desktop Electron multi-engine Host journey'],
      status: 'external_blocked',
      blockedReason: 'Requires Desktop runtime + auth fixture; not claimed green in residual 405',
    },
    {
      id: 'e2e.real_pi_spawn',
      surface: 'desktop',
      transport: 'ipc',
      title: 'Real Pi process spawn product path',
      contracts: ['process.pi_readonly_spike product wiring'],
      status: 'external_blocked',
      blockedReason: 'Pi spawn remains research spike fail-closed; security review required',
    },
  ];
}

export function summarizeCrossEndMultiEngineProductJourney(
  steps: CrossEndMultiEngineProductStep[] = buildCrossEndMultiEngineProductJourney(),
): {
  total: number;
  scaffolded: number;
  implementedUnit: number;
  externalBlocked: number;
  readyForDriver: boolean;
} {
  const implementedUnit = steps.filter((s) => s.status === 'implemented_unit').length;
  const scaffolded = steps.filter((s) => s.status === 'scaffolded').length;
  const externalBlocked = steps.filter((s) => s.status === 'external_blocked').length;
  return {
    total: steps.length,
    scaffolded,
    implementedUnit,
    externalBlocked,
    // Ready for a driver only when unit path is frozen and external gaps are explicit.
    readyForDriver: implementedUnit > 0 && externalBlocked > 0,
  };
}
