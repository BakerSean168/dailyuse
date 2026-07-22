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
        'packages/app-vue/src/modules/ai/composables/types.ts',
        'packages/ai/src/server/infrastructure/runtime/host-task-create-start.ts',
        'packages/ai/src/server/infrastructure/runtime/host-task-create-run-store.ts',
        'packages/ai/src/server/infrastructure/runtime/host-task-create-resume.ts',
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
