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
      title: 'Host task.create live lane + product start + restore/linked goal',
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
