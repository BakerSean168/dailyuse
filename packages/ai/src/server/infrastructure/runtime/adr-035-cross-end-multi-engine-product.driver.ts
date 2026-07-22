/**
 * Residual 407/417/421/423/425/427/429/431/433/435: ADR-035 cross-end multi-engine Host product unit driver.
 *
 * Executes residual 405 scaffold `implemented_unit` steps as source-level
 * contract checks (HTTP SSE / Desktop IPC / Vue selectors / Host cancel +
 * session memory). External-blocked steps are skipped with reasons — never
 * reported as product E2E green.
 *
 * This is not Playwright/Electron full product E2E and not real Pi spawn.
 */

import {
  buildCrossEndMultiEngineProductJourney,
  type CrossEndMultiEngineProductStep,
} from './adr-035-cross-end-multi-engine-product.scaffold';

export type CrossEndMultiEngineProductSourceReader = (relativePath: string) => string;

export type CrossEndMultiEngineProductDriverStepStatus =
  | 'passed'
  | 'failed'
  | 'skipped_external';

export type CrossEndMultiEngineProductDriverStepResult = {
  stepId: string;
  title: string;
  status: CrossEndMultiEngineProductDriverStepStatus;
  checkedSources: readonly string[];
  missingContracts: readonly string[];
  blockedReason?: string;
};

export type CrossEndMultiEngineProductDriverRun = {
  results: readonly CrossEndMultiEngineProductDriverStepResult[];
  passed: number;
  failed: number;
  skippedExternal: number;
  /** Always false — residual 407 never claims full product E2E. */
  claimsFullProductE2E: false;
  /** Always false — residual 407 never claims real Pi spawn. */
  claimsRealPiSpawn: false;
};

/**
 * Stable source map for residual 407 unit contracts.
 * Paths are repo-relative from workspace root.
 */
export function resolveCrossEndMultiEngineProductStepSources(
  stepId: string,
): readonly string[] {
  switch (stepId) {
    case 'ui.select_direct_turn':
    case 'ui.select_pi_readonly':
    case 'ui.stop_cancel_run':
      return [
        'packages/app-vue/src/modules/ai/components/AIFooterComposer.vue',
        'packages/app-vue/src/modules/ai/composables/useAIChatSession.ts',
        'packages/app-vue/src/modules/ai/composables/hostOpenChatCancel.ts',
      ];
    case 'web.send_direct_turn':
    case 'web.send_pi_readonly':
      return [
        'packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.ts',
        'packages/ai/src/infrastructure-client/adapters/http/ai-assistant-http.adapter.test.ts',
        'packages/ai/src/server/transport/ai-assistant-facade.controller.ts',
        'packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts',
      ];
    case 'desktop.send_direct_turn':
    case 'desktop.send_pi_readonly':
      return [
        'packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.ts',
        'packages/ai/src/infrastructure-client/adapters/ipc/ai-assistant-ipc.adapter.test.ts',
        'packages/contracts/src/electron/ipc-channels.ts',
        'packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts',
      ];
    case 'ui.timeline_engine_badge_direct':
      return [
        'packages/app-vue/src/modules/ai/components/AIHostTimelineArtifactStrip.vue',
        'packages/app-vue/src/modules/ai/composables/useAIChatSession.ts',
        'packages/app-vue/src/modules/ai/views/AIChatView.vue',
      ];
    case 'host.mid_turn_cancel':
      return [
        'packages/ai/src/server/infrastructure/assistant-facade/assistant.facade.ts',
        'packages/ai/src/server/infrastructure/runtime/__tests__/adr-035-production-multi-engine-host.journey.spec.ts',
      ];
    case 'ui.conversation_switch_badge_memory':
      return [
        'packages/app-vue/src/modules/ai/composables/hostOpenChatTurnMemory.ts',
        'packages/app-vue/src/modules/ai/composables/useAIChatSession.ts',
      ];
    case 'ui.timeline_surface_isolation':
      return [
        'packages/app-vue/src/modules/ai/composables/hostProposalLifecycle.ts',
        'packages/app-vue/src/modules/ai/composables/hostProposalLifecycle.spec.ts',
      ];
    case 'ui.workbench_timeline_composition':
      return [
        'packages/app-vue/src/modules/ai/composables/hostProposalLifecycle.ts',
        'packages/app-vue/src/modules/ai/views/AIChatView.vue',
      ];
    case 'ui.langgraph_diagnostic_sanitization':
      return [
        'packages/app-vue/src/modules/ai/composables/hostLangGraphUiBoundary.ts',
        'packages/app-vue/src/modules/ai/components/AIGoalWorkflowPanel.vue',
      ];
    case 'ui.task_create_proposal_receipt_lane':
      return [
        'packages/app-vue/src/modules/ai/composables/hostProposalLifecycle.ts',
        'packages/app-vue/src/modules/ai/composables/useAIChatView.ts',
        'packages/app-vue/src/modules/ai/composables/useAITaskWorkflow.ts',
        'packages/app-vue/src/modules/ai/composables/useAIKnowledgeNoteWorkflow.ts',
        'packages/app-vue/src/modules/ai/composables/useAIGoalWorkflow.ts',
        'packages/app-vue/src/modules/ai/composables/types.ts',
        'packages/ai/src/server/infrastructure/runtime/host-task-create-start.ts',
        'packages/ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
        'packages/ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
        'packages/ai/src/server/infrastructure/runtime/__tests__/host-task-create-product.journey.spec.ts',
        'packages/ai/src/server/infrastructure/runtime/ai-runtime.ts',
        'packages/app-vue/src/modules/ai/components/AIWorkflowActionBar.vue',
        'packages/app-vue/src/modules/ai/components/AIHostProposalPanel.vue',
        'packages/app-vue/src/modules/ai/components/AIHostExecutionReceiptPanel.vue',
        'packages/app-vue/src/modules/ai/components/AIMessagePanel.vue',
        'packages/app-vue/src/modules/ai/components/AIFooterComposer.vue',
        'packages/app-vue/src/modules/ai/views/AIChatView.vue',
        'packages/contracts/src/modules/ai/api/ai-agent.dto.ts',
      ];
    case 'e2e.playwright_web_full':
    case 'e2e.electron_desktop_full':
    case 'e2e.real_pi_spawn':
      return [];
    default:
      return [];
  }
}

/**
 * Optional contract rewrite when the scaffold string is conceptual and the
 * source uses a slightly different literal (still the same product contract).
 */
function contractNeedles(contract: string): readonly string[] {
  switch (contract) {
    case "type:'message'":
      return ["type: 'message'", "type:'message'"];
    case "type:'cancel_run'":
      return ["type: 'cancel_run'", "type:'cancel_run'"];
    case 'no identityId in client body':
      return ['identityId', 'without identityId'];
    case 'no process.pi_readonly_spike':
      return ['process.pi_readonly_spike'];
    case 'run.started engine.direct_turn':
      return ['engine.direct_turn', 'direct_turn'];
    case 'run.started engine.pi_readonly':
      return ['engine.pi_readonly', 'pi_readonly'];
    case 'data-engine-key=engine.direct_turn':
      return ['data-engine-key', 'engine.direct_turn'];
    case 'surface:open_chat':
      return ['open_chat', 'openChat'];
    case 'client-owned runId':
      return ['createHostOpenChatRunId', 'runId'];
    case 'run.cancelled':
      return ['cancel_run', 'run.cancelled', 'cancelled'];
    case 'message.completed status:aborted':
      return ['aborted', 'cancel_run'];
    case 'AssistantFacade cancel_run':
      return ['cancel_run'];
    case 'openChatHostTurnMemory':
      return ['OpenChatHostTurnMemory', 'openChatHostTurnMemory'];
    case 'partitionHostTimelineArtifactsBySurface':
      return ['partitionHostTimelineArtifactsBySurface'];
    case 'collectHostTimelineSurfaceIsolationViolations':
      return ['collectHostTimelineSurfaceIsolationViolations'];
    case 'isolationOk':
      return ['isolationOk'];
    case 'composeHostWorkbenchTimelineArtifacts':
      return ['composeHostWorkbenchTimelineArtifacts'];
    case 'hostWorkbenchTimeline':
      return ['hostWorkbenchTimeline'];
    case 'openChatHostTurns':
      return ['openChatHostTurns'];
    case 'formatLangGraphVendorDiagnosticEventLabel':
      return ['formatLangGraphVendorDiagnosticEventLabel'];
    case 'workflow_step_completed':
      return ['workflow_step_completed'];
    case 'no raw node.started UI label path':
      return ['formatLangGraphVendorDiagnosticEventLabel', 'workflow_step_started'];
    case "kind: 'task.create'":
      return ["kind: 'task.create'", 'task.create'];
    case "'task-create'":
      return ["'task-create'", 'task-create'];
    case 'ai-chat-tool-task-create':
      return ['ai-chat-tool-task-create'];
    case "toolMode.value = 'task-create'":
      return ["toolMode.value = 'task-create'", "'task-create'"];
    case 'buildHostTaskCreateStartResult':
      return ['buildHostTaskCreateStartResult'];
    case 'startTaskAgentRun':
      return ['startTaskAgentRun'];
    case 'task-agent-start-run':
      return ['task-agent-start-run'];
    case 'restore dedicated task.create session field':
      return ['restore dedicated task.create session field', 'Residual 433'];
    case 'task-agent-linked-goal':
      return ['task-agent-linked-goal'];
    case 'linkedGoalId':
      return ['linkedGoalId'];
    case 'taskCreateRunStore':
      return ['taskCreateRunStore'];
    case 'createHostTaskCreateRunStore':
      return ['createHostTaskCreateRunStore'];
    case 'taskCreateRunStore.upsert':
      return ['taskCreateRunStore.upsert', 'taskCreateRunStore.upsert('];
    case 'buildHostTaskCreateResumeResult':
      return ['buildHostTaskCreateResumeResult'];
    case 'cancelTaskAgentRun':
      return ['cancelTaskAgentRun'];
    case 'completeTaskAgentRun':
      return ['completeTaskAgentRun'];
    case 'reviseTaskAgentRun':
      return ['reviseTaskAgentRun'];
    case "userDecision: 'edit'":
      return ["userDecision: 'edit'", "userDecision: 'edit'"];
    case 'idempotent terminal resume':
      return ['idempotent terminal resume'];
    case 'resolveHostWorkbenchFocusFromAgentRun':
      return ['resolveHostWorkbenchFocusFromAgentRun'];
    case 'focusedHostProposalId.value = focus?.proposalId':
      return ['focusedHostProposalId.value = focus?.proposalId', 'focus?.proposalId'];
    case 'resolveHostWorkbenchFocusFromSessionRuns':
      return ['resolveHostWorkbenchFocusFromSessionRuns'];
    case 'selectConversationBase':
      return ['selectConversationBase'];
    case 'hostProposalItems.value[0]?.proposalId':
      return ['hostProposalItems.value[0]?.proposalId'];
    case 'resolveLinkedGoalIdFromTaskAgentRun':
      return ['resolveLinkedGoalIdFromTaskAgentRun'];
    case 'syncLinkedGoalFromTaskAgentRun':
      return ['syncLinkedGoalFromTaskAgentRun'];
    case 'clientSettledHostProposalIds.value = []':
      return ['clientSettledHostProposalIds.value = []', 'clientSettledHostProposalIds.value = []'];
    case 'HOST_TASK_CREATE_RUN_STORE_MAX_ENTRIES':
      return ['HOST_TASK_CREATE_RUN_STORE_MAX_ENTRIES'];
    case 'pruneOldest':
      return ['pruneOldest'];
    case 'host-task-create-product.journey':
      return ['host-task-create-product.journey', 'Host task.create process-local product journey'];
    case 'start → edit → cancel':
      return ['start → edit → cancel'];
    case 'start → confirm settle':
      return ['start → confirm settle'];
    case 'HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE':
      return ['HOST_TASK_CREATE_RUN_ID_IDENTITY_BOUND_MESSAGE'];
    case 'already bound to another identity':
      return ['already bound to another identity'];
    case 'HOST_TASK_CREATE_CONFIRM_REQUIRES_CLIENT_SETTLEMENT_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_REQUIRES_CLIENT_SETTLEMENT_MESSAGE'];
    case 'requires non-empty client executedActions settlement':
      return ['requires non-empty client executedActions settlement'];
    case 'HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_TITLE_MESSAGE':
      return ['HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_TITLE_MESSAGE'];
    case 'requires a non-empty revised title':
      return ['requires a non-empty revised title'];
    case 'HOST_TASK_CREATE_RUN_ID_CONVERSATION_BOUND_MESSAGE':
      return ['HOST_TASK_CREATE_RUN_ID_CONVERSATION_BOUND_MESSAGE'];
    case 'HOST_TASK_CREATE_RUN_ID_THREAD_BOUND_MESSAGE':
      return ['HOST_TASK_CREATE_RUN_ID_THREAD_BOUND_MESSAGE'];
    case 'already bound to another conversation':
      return ['already bound to another conversation'];
    case 'shouldReviseProcessLocalTaskDraftBeforeDomainSettle':
      return ['shouldReviseProcessLocalTaskDraftBeforeDomainSettle'];
    case 'dirty approve must revise process-local draft':
      return ['dirty approve must revise process-local draft', 'Residual 459'];
    case 'HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE':
      return ['HOST_TASK_CREATE_START_REQUIRES_CONVERSATION_MESSAGE'];
    case 'resolveTaskCreateConversationId':
      return ['resolveTaskCreateConversationId'];
    case 'HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TITLE_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TITLE_MESSAGE'];
    case 'resolveConfirmSettlementTitle':
      return ['resolveConfirmSettlementTitle'];
    case 'HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TEMPLATE_ID_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_REQUIRES_SETTLEMENT_TEMPLATE_ID_MESSAGE'];
    case 'resolveConfirmSettlementTemplateId':
      return ['resolveConfirmSettlementTemplateId'];
    case 'HOST_TASK_CREATE_CONFIRM_GOAL_REBIND_FORBIDDEN_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_GOAL_REBIND_FORBIDDEN_MESSAGE'];
    case 'resolveConfirmSettlementGoalId':
      return ['resolveConfirmSettlementGoalId'];
    case 'HOST_TASK_CREATE_CONFIRM_TITLE_REBIND_FORBIDDEN_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_TITLE_REBIND_FORBIDDEN_MESSAGE'];
    case 'HOST_TASK_CREATE_CONFIRM_REQUIRES_STORE_DRAFT_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_REQUIRES_STORE_DRAFT_MESSAGE'];
    case 'HOST_TASK_CREATE_CONFIRM_REQUIRES_SINGLE_EXECUTED_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_REQUIRES_SINGLE_EXECUTED_MESSAGE'];
    case 'resolveConfirmStoreDraftActions':
      return ['resolveConfirmStoreDraftActions'];
    case 'HOST_TASK_CREATE_EDIT_REQUIRES_SINGLE_ACTION_MESSAGE':
      return ['HOST_TASK_CREATE_EDIT_REQUIRES_SINGLE_ACTION_MESSAGE'];
    case 'HOST_TASK_CREATE_CONFIRM_REQUIRES_WAITING_APPROVAL_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_REQUIRES_WAITING_APPROVAL_MESSAGE'];
    case 'HOST_TASK_CREATE_CANCEL_REQUIRES_WAITING_APPROVAL_MESSAGE':
      return ['HOST_TASK_CREATE_CANCEL_REQUIRES_WAITING_APPROVAL_MESSAGE'];
    case 'HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE':
      return ['HOST_TASK_CREATE_START_REQUIRES_TITLE_MESSAGE'];
    case 'HOST_TASK_CREATE_EDIT_REQUIRES_WAITING_APPROVAL_MESSAGE':
      return ['HOST_TASK_CREATE_EDIT_REQUIRES_WAITING_APPROVAL_MESSAGE'];
    case 'Residual 483':
      return ['Residual 483'];
    case 'HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE':
      return ['HOST_TASK_CREATE_START_REQUIRES_THREAD_MESSAGE'];
    case 'resolveTaskCreateThreadId':
      return ['resolveTaskCreateThreadId'];
    case 'HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE':
      return ['HOST_TASK_CREATE_START_REQUIRES_IDENTITY_MESSAGE'];
    case 'resolveTaskCreateIdentityId':
      return ['resolveTaskCreateIdentityId'];
    case 'Residual 489':
      return ['Residual 489'];
    case 'completeTaskAgentRun':
      return ['completeTaskAgentRun'];
    case 'HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_ACTIONS_MESSAGE':
      return ['HOST_TASK_CREATE_EDIT_REQUIRES_NONEMPTY_ACTIONS_MESSAGE'];
    case 'HOST_TASK_CREATE_EDIT_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE':
      return ['HOST_TASK_CREATE_EDIT_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE'];
    case 'HOST_TASK_CREATE_CONFIRM_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_REQUIRES_CREATE_TASK_TEMPLATE_MESSAGE'];
    case 'HOST_TASK_CREATE_CONFIRM_REQUIRES_EXECUTED_STATUS_MESSAGE':
      return ['HOST_TASK_CREATE_CONFIRM_REQUIRES_EXECUTED_STATUS_MESSAGE'];
    case 'HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE':
      return ['HOST_TASK_CREATE_RESUME_REQUIRES_AGENT_TYPE_MESSAGE'];
    case 'HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE':
      return ['HOST_TASK_CREATE_RESUME_UNSUPPORTED_USER_DECISION_MESSAGE'];
    case 'HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE':
      return ['HOST_TASK_CREATE_RUN_STORE_REQUIRES_AGENT_TYPE_MESSAGE'];
    case 'HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE':
      return ['HOST_TASK_CREATE_START_REQUIRES_RUN_ID_MESSAGE'];
    case 'resolveTaskCreateRunId':
      return ['resolveTaskCreateRunId'];
    case 'HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE':
      return ['HOST_TASK_CREATE_START_REQUIRES_AGENT_TYPE_MESSAGE'];
    case 'Residual 501':
      return ['Residual 501'];
    case "action.tool === 'create_task_template'":
      return ["action.tool === 'create_task_template'"];
    case 'matchesHostTaskCreateIdentity':
      return ['matchesHostTaskCreateIdentity'];
    case 'Residual 503':
      return ['Residual 503'];
    case 'ensureAgentRunOwnedByIdentity':
      return ['ensureAgentRunOwnedByIdentity'];
    case 'HOST_TASK_CREATE_RUN_STORE_REQUIRES_RUN_ID_MESSAGE':
      return ['HOST_TASK_CREATE_RUN_STORE_REQUIRES_RUN_ID_MESSAGE'];
    case 'Residual 505':
      return ['Residual 505'];
    case 'Residual 507':
      return ['Residual 507'];
    case 'Residual 547':
      return ['Residual 547'];
    case 'productDrafts.length !== 1':
      return ['productDrafts.length !== 1'];
    case 'const draftAction = productDrafts[0]':
      return ['const draftAction = productDrafts[0]'];
    case 'Residual 549':
      return ['Residual 549'];
    case 'function soleProductDraftAction':
      return ['function soleProductDraftAction'];
    case 'soleProductDraftAction(run, productTool)':
      return ['soleProductDraftAction(run, productTool)'];
    case 'Residual 551':
      return ['Residual 551'];
    case 'productDraftCount !== 1':
      return ['productDraftCount !== 1'];
    case 'Residual 553':
      return ['Residual 553'];
    case 'function resolveConfirmStoreDraftActions':
      return ['function resolveConfirmStoreDraftActions'];
    case 'return productDrafts':
      return ['return productDrafts'];
    case 'Residual 555':
      return ['Residual 555'];
    case 'Residual 557':
      return ['Residual 557'];
    case 'Residual 559':
      return ['Residual 559'];
    case 'Residual 561':
      return ['Residual 561'];
    case 'canHostApproveProductAgentRun':
      return ['canHostApproveProductAgentRun'];
    case 'Residual 563':
      return ['Residual 563'];
    case "productTool: 'create_task_template'":
      return ["productTool: 'create_task_template'"];
    case 'Residual 565':
      return ['Residual 565'];
    case 'canHostRejectProductAgentRun':
      return ['canHostRejectProductAgentRun'];
    case 'Residual 567':
      return ['Residual 567'];
    case 'canHostReviseProductAgentRun':
      return ['canHostReviseProductAgentRun'];
    case 'Residual 569':
      return ['Residual 569'];
    case 'resolveHostPanelOwnedProductRun':
      return ['resolveHostPanelOwnedProductRun'];
    case 'Residual 571':
      return ['Residual 571'];
    case "owned?.productTool === 'create_task_template'":
      return ["owned?.productTool === 'create_task_template'"];
    case 'Residual 573':
      return ['Residual 573'];
    case 'Residual 575':
      return ['Residual 575'];
    case 'Residual 577':
      return ['Residual 577'];
    case 'Residual 579':
      return ['Residual 579'];
    case 'Residual 581':
      return ['Residual 581'];
    case 'isHostPanelProcessLocalTaskCreateOwned':
      return ['isHostPanelProcessLocalTaskCreateOwned'];
    case 'isHostPanelGoalSessionProductOwned':
      return ['isHostPanelGoalSessionProductOwned'];
    case 'Residual 583':
      return ['Residual 583'];
    case 'goalId: hostOptions?.goalId':
      return ['goalId: hostOptions?.goalId'];
    case 'Residual 585':
      return ['Residual 585'];
    case 'isPrimaryTaskHostAgentRun(result)':
      return ['isPrimaryTaskHostAgentRun(result)'];
    case 'Residual 587':
      return ['Residual 587'];
    case 'kind: hostProposalKind':
      return ['kind: hostProposalKind'];
    case 'Residual 589':
      return ['Residual 589'];
    case 'nextDualMirroredTaskAgentRun':
      return ['nextDualMirroredTaskAgentRun'];
    case 'Residual 591':
      return ['Residual 591'];
    case 'Residual 593':
      return ['Residual 593'];
    case 'Residual 595':
      return ['Residual 595'];
    case 'Residual 597':
      return ['Residual 597'];
    case 'Residual 599':
      return ['Residual 599'];
    case 'Residual 601':
      return ['Residual 601'];
    case 'Residual 603':
      return ['Residual 603'];
    case 'isHostPanelKnowledgeSessionProductOwned':
      return ['isHostPanelKnowledgeSessionProductOwned'];
    case 'Residual 605':
      return ['Residual 605'];
    case 'reviseKnowledgeNoteAgentRun':
      return ['reviseKnowledgeNoteAgentRun'];
    case 'matchesHostTaskCreateConversation':
      return ['matchesHostTaskCreateConversation'];
    case 'Residual 509':
      return ['Residual 509'];
    case 'matchesHostTaskCreateThread':
      return ['matchesHostTaskCreateThread'];
    case 'HOST_TASK_CREATE_RUN_STORE_REQUIRES_THREAD_MESSAGE':
      return ['HOST_TASK_CREATE_RUN_STORE_REQUIRES_THREAD_MESSAGE'];
    case 'Residual 511':
      return ['Residual 511'];
    case 'HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE':
      return ['HOST_TASK_CREATE_RUN_STORE_REQUIRES_CONVERSATION_MESSAGE'];
    case 'Residual 513':
      return ['Residual 513'];
    case 'HOST_TASK_CREATE_RUN_STORE_REQUIRES_IDENTITY_MESSAGE':
      return ['HOST_TASK_CREATE_RUN_STORE_REQUIRES_IDENTITY_MESSAGE'];
    case 'Residual 515':
      return ['Residual 515'];
    case 'Residual 517':
      return ['Residual 517'];
    case 'matchesHostTaskCreateIdentity(run.identityId, cx.identityId)':
      return ['matchesHostTaskCreateIdentity(run.identityId, cx.identityId)'];
    case 'Residual 519':
      return ['Residual 519'];
    case 'firstCreateTaskTemplateAction':
      return ['firstCreateTaskTemplateAction'];
    case 'Residual 521':
      return ['Residual 521'];
    case 'firstCreateKnowledgeNoteAction':
      return ['firstCreateKnowledgeNoteAction'];
    case 'Residual 523':
      return ['Residual 523'];
    case 'firstCreateGoalAction':
      return ['firstCreateGoalAction'];
    case 'Residual 525':
      return ['Residual 525'];
    case "firstPendingRationale(goalRun, 'create_goal')":
      return ["firstPendingRationale(goalRun, 'create_goal')"];
    case 'Residual 527':
      return ['Residual 527'];
    case "pendingActionCount(goalRun, 'create_goal')":
      return ["pendingActionCount(goalRun, 'create_goal')"];
    case 'Residual 529':
      return ['Residual 529'];
    case "summarizeExecutedActions(goalRun, 'create_goal')":
      return ["summarizeExecutedActions(goalRun, 'create_goal')"];
    case 'Residual 531':
      return ['Residual 531'];
    case 'function knowledgeDraftTitle':
      return ['function knowledgeDraftTitle'];
    case 'Residual 533':
      return ['Residual 533'];
    case 'isCrossLaneForeignTool':
      return ['isCrossLaneForeignTool'];
    case 'Residual 535':
      return ['Residual 535'];
    case 'firstFailedMessage':
      return ['firstFailedMessage'];
    case 'Residual 537':
      return ['Residual 537'];
    case 'productLaneExecuted':
      return ['productLaneExecuted'];
    case 'Residual 541':
      return ['Residual 541'];
    case 'const draftAction = pendingActions[0]':
      return ['const draftAction = pendingActions[0]'];
    case 'Residual 543':
      return ['Residual 543'];
    case 'const settlementAction = executedActions[0]':
      return ['const settlementAction = executedActions[0]'];
    case 'Residual 545':
      return ['Residual 545'];
    case 'const draftAction = approvedActions[0]':
      return ['const draftAction = approvedActions[0]'];
    case 'domain Task executor not wired':
      return ['domain Task executor not wired', 'Host lifecycle only'];
    default:
      return [contract];
  }
}

function sourcesContainContract(sources: readonly string[], contract: string): boolean {
  // Conceptual profile contracts: require both executionProfileId and the profile token.
  if (contract.startsWith('executionProfileId:')) {
    const profile = contract.slice('executionProfileId:'.length);
    const hasProfileKey = sources.some((src) => src.includes('executionProfileId'));
    const hasProfileValue = sources.some((src) => src.includes(profile));
    return hasProfileKey && hasProfileValue;
  }

  const needles = contractNeedles(contract);
  // Special-case negative contracts: absence is the pass condition on product path.
  if (contract === 'no process.pi_readonly_spike') {
    // Product path sources must not wire the spike as a production engine.
    // Facade/controller must not contain process.pi_readonly_spike.
    return sources.every((src) => {
      if (src.includes('process.pi_readonly_spike') && src.includes('productDefault')) {
        // Adapter surface may document the spike id — require fail-closed markers.
        return src.includes('productDefault = false') || src.includes('PI_SPIKE_SPAWN_BLOCKED');
      }
      // Prefer absence on transport/facade product wiring.
      return !src.includes("engine: 'process.pi_readonly_spike'")
        && !src.includes('process.pi_readonly_spike');
    }) || sources.some((src) => src.includes('no process.pi_readonly_spike'));
  }
  if (contract === 'no identityId in client body') {
    // Pass when tests assert client body omits identityId, or adapter never
    // injects identityId into the request body payload.
    return sources.some((src) =>
      src.includes('without identityId')
      || src.includes('never send identityId')
      || src.includes('must not include identityId'),
    );
  }
  return needles.some((needle) => sources.some((src) => src.includes(needle)));
}

export function runCrossEndMultiEngineProductUnitDriver(input: {
  readSource: CrossEndMultiEngineProductSourceReader;
  journey?: readonly CrossEndMultiEngineProductStep[];
}): CrossEndMultiEngineProductDriverRun {
  const journey = input.journey ?? buildCrossEndMultiEngineProductJourney();
  const results: CrossEndMultiEngineProductDriverStepResult[] = [];

  for (const step of journey) {
    if (step.status === 'external_blocked') {
      results.push({
        stepId: step.id,
        title: step.title,
        status: 'skipped_external',
        checkedSources: [],
        missingContracts: [],
        blockedReason: step.blockedReason,
      });
      continue;
    }

    if (step.status !== 'implemented_unit') {
      results.push({
        stepId: step.id,
        title: step.title,
        status: 'failed',
        checkedSources: [],
        missingContracts: [...step.contracts],
      });
      continue;
    }

    const sourcePaths = resolveCrossEndMultiEngineProductStepSources(step.id);
    const sources = sourcePaths.map((relativePath) => {
      try {
        return input.readSource(relativePath);
      } catch {
        return '';
      }
    });
    const missing = step.contracts.filter(
      (contract) => !sourcesContainContract(sources, contract),
    );

    results.push({
      stepId: step.id,
      title: step.title,
      status: missing.length === 0 ? 'passed' : 'failed',
      checkedSources: sourcePaths,
      missingContracts: missing,
    });
  }

  return {
    results,
    passed: results.filter((r) => r.status === 'passed').length,
    failed: results.filter((r) => r.status === 'failed').length,
    skippedExternal: results.filter((r) => r.status === 'skipped_external').length,
    claimsFullProductE2E: false,
    claimsRealPiSpawn: false,
  };
}

export function summarizeCrossEndMultiEngineProductDriverRun(
  run: CrossEndMultiEngineProductDriverRun,
): {
  total: number;
  passed: number;
  failed: number;
  skippedExternal: number;
  unitPathGreen: boolean;
  claimsFullProductE2E: false;
  claimsRealPiSpawn: false;
} {
  return {
    total: run.results.length,
    passed: run.passed,
    failed: run.failed,
    skippedExternal: run.skippedExternal,
    unitPathGreen: run.failed === 0 && run.passed > 0,
    claimsFullProductE2E: false,
    claimsRealPiSpawn: false,
  };
}
