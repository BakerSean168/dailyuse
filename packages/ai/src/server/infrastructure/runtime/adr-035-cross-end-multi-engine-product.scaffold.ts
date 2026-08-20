/**
 * Historical ADR-035 cross-end product scaffold, repurposed by AI-vNext Batch B.
 *
 * The file/export names remain stable for archived residual references, but the
 * product contract is no longer "select DirectTurn vs pi_readonly". Default
 * open chat is now one Mastra Assistant runtime with host-owned Web/Desktop
 * transport projection. Legacy Agent Host engines may continue to exist for
 * migration-only workflow paths, but they are not a user-selectable chat mode.
 *
 * This scaffold combines source-level conformance with a real Web Playwright
 * product run. It still does not claim the cross-end journey is complete until
 * the packaged Electron path is executed.
 */

export type CrossEndMultiEngineProductSurface = 'web' | 'desktop' | 'shared';

export type CrossEndMultiEngineProductTransport = 'http_sse' | 'ipc' | 'ui' | 'runtime';

export type CrossEndMultiEngineProductStepStatus =
  'scaffolded' | 'implemented_unit' | 'external_blocked';

export type CrossEndMultiEngineProductStep = {
  id: string;
  surface: CrossEndMultiEngineProductSurface;
  transport: CrossEndMultiEngineProductTransport;
  title: string;
  /** Presence contracts; prefix with `!` for a required absence. */
  contracts: readonly string[];
  status: CrossEndMultiEngineProductStepStatus;
  blockedReason?: string;
};

/**
 * Canonical Batch-B cutover journey. The legacy function name is intentionally
 * retained so archived ADR-035 references keep compiling while asserting the
 * new product truth.
 */
export function buildCrossEndMultiEngineProductJourney(): CrossEndMultiEngineProductStep[] {
  return [
    {
      id: 'ui.mastra_runtime_injection',
      surface: 'shared',
      transport: 'ui',
      title: 'Vue resolves a dedicated AssistantRuntimeClient',
      contracts: ['AI_ASSISTANT_RUNTIME_KEY', 'AIAssistantRuntime'],
      status: 'implemented_unit',
    },
    {
      id: 'ui.mastra_open_chat',
      surface: 'shared',
      transport: 'ui',
      title: 'Open chat history/send/stop/delete use the Mastra runtime seam',
      contracts: [
        'options.runtime.listMessages(conversationId)',
        'options.runtime.streamMessage(',
        'options.runtime.cancelRun(runId)',
        'options.runtime.deleteConversation(id)',
        '!useAssistantDispatch',
        '!executionProfileId',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.legacy_profile_selector_retired',
      surface: 'shared',
      transport: 'ui',
      title: 'Default chat no longer exposes DirectTurn / pi_readonly product selectors',
      contracts: ['!ai-chat-execution-profile', "!'select-execution-profile'"],
      status: 'implemented_unit',
    },
    {
      id: 'web.mastra_runtime_client',
      surface: 'web',
      transport: 'http_sse',
      title: 'Web host injects AssistantRuntimeHttpClient',
      contracts: ['createAssistantRuntimeHttpClient', 'AI_ASSISTANT_RUNTIME_KEY'],
      status: 'implemented_unit',
    },
    {
      id: 'desktop.mastra_runtime_client',
      surface: 'desktop',
      transport: 'ipc',
      title: 'Desktop host injects AssistantRuntimeIpcClient',
      contracts: ['createAssistantRuntimeIpcClient', 'AI_ASSISTANT_RUNTIME_KEY'],
      status: 'implemented_unit',
    },
    {
      id: 'transport.http_runtime_surface',
      surface: 'web',
      transport: 'http_sse',
      title: 'HTTP runtime exposes history/delete/stream/cancel with server-owned identity',
      contracts: [
        '/ai/runtime/assistant/history',
        '/ai/runtime/assistant/delete',
        '/ai/runtime/assistant/sse',
        '/ai/runtime/assistant/cancel',
        'authenticatedIdentity(req)',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'transport.ipc_runtime_surface',
      surface: 'desktop',
      transport: 'ipc',
      title: 'Desktop IPC exposes the same canonical Assistant runtime surface',
      contracts: [
        'RUNTIME_ASSISTANT_HISTORY',
        'RUNTIME_ASSISTANT_DELETE',
        'RUNTIME_ASSISTANT_START',
        'RUNTIME_ASSISTANT_CANCEL',
        'withAuthenticatedValue',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'runtime.one_time_transcript_bootstrap',
      surface: 'shared',
      transport: 'runtime',
      title: 'Legacy Conversation transcript is imported once into Mastra memory',
      contracts: [
        'memoflowTranscriptBootstrapVersion',
        'ConversationTranscriptBootstrapSource',
        'includeChildren: true',
        '!createMessage',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'runtime.restart_persistence',
      surface: 'shared',
      transport: 'runtime',
      title: 'A restarted runtime reopens the same persistent Mastra thread without legacy reread',
      contracts: [
        'persistent restart cutover',
        'restartedSource.load',
        'not.toHaveBeenCalled()',
        'createMastraStorage',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'runtime.owner_scoped_delete',
      surface: 'shared',
      transport: 'runtime',
      title: 'Conversation delete removes owner-scoped Mastra memory before the legacy shell',
      contracts: [
        'deleteConversation',
        'memory.deleteThread',
        'await options.runtime.deleteConversation(id)',
        'await loadService.deleteConversation',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'runtime.model_usage_metadata',
      surface: 'shared',
      transport: 'runtime',
      title: 'Assistant runtime projects selected model/provider and usage metadata',
      contracts: [
        'assistant.run.started',
        'providerId',
        'modelId',
        'assistant.usage.updated',
        'promptTokens',
        'completionTokens',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'runtime.python_chat_not_composed',
      surface: 'shared',
      transport: 'runtime',
      title: 'API and Desktop default open-chat composition no longer wires Python chat execution',
      contracts: ['!AIServiceChatExecutionAdapter', '!chatExecutionPort:'],
      status: 'implemented_unit',
    },
    {
      id: 'ui.workflow_timeline_isolation',
      surface: 'shared',
      transport: 'ui',
      title: 'Legacy workflow Host artifacts remain isolated from Mastra open chat',
      contracts: [
        'partitionHostTimelineArtifactsBySurface',
        'collectHostTimelineSurfaceIsolationViolations',
        'isolationOk',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.workbench_without_open_chat_engine_badges',
      surface: 'shared',
      transport: 'ui',
      title: 'Workbench composition no longer manufactures legacy open-chat engine cards',
      contracts: [
        'composeHostWorkbenchTimelineArtifacts',
        'openChatTurns: []',
        '!openChatHostTurns',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'ui.langgraph_diagnostic_sanitization',
      surface: 'shared',
      transport: 'ui',
      title: 'Workflow diagnostics continue to sanitize LangGraph vendor labels',
      contracts: ['formatLangGraphVendorDiagnosticEventLabel', 'workflow_step_completed'],
      status: 'implemented_unit',
    },
    {
      id: 'e2e.playwright_web_full',
      surface: 'web',
      transport: 'http_sse',
      title: 'Full Playwright Web Mastra open-chat journey',
      contracts: [
        'AI Mastra open-chat product cutover',
        '/ai/runtime/assistant/sse',
        'reload restores the authoritative Mastra transcript',
      ],
      status: 'implemented_unit',
    },
    {
      id: 'e2e.electron_desktop_full',
      surface: 'desktop',
      transport: 'ipc',
      title: 'Full Electron Desktop Mastra open-chat journey',
      contracts: ['apps/desktop Electron Mastra Assistant journey'],
      status: 'external_blocked',
      blockedReason: 'Requires packaged Desktop runtime + authenticated profile fixture.',
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
  const implementedUnit = steps.filter((step) => step.status === 'implemented_unit').length;
  const scaffolded = steps.filter((step) => step.status === 'scaffolded').length;
  const externalBlocked = steps.filter((step) => step.status === 'external_blocked').length;
  return {
    total: steps.length,
    scaffolded,
    implementedUnit,
    externalBlocked,
    readyForDriver: implementedUnit > 0 && externalBlocked > 0,
  };
}
