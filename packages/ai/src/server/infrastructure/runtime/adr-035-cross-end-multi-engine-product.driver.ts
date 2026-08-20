/**
 * Historical ADR-035 unit driver, retained as a stable compatibility name.
 *
 * AI-vNext Batch B repurposes it to execute source-level conformance checks for
 * the Mastra open-chat cutover. `implemented_unit` steps are checked; external
 * product runners stay explicit and are never reported as green here.
 */

import {
  buildCrossEndMultiEngineProductJourney,
  type CrossEndMultiEngineProductStep,
} from './adr-035-cross-end-multi-engine-product.scaffold';

export type CrossEndMultiEngineProductSourceReader = (relativePath: string) => string;

export type CrossEndMultiEngineProductDriverStepStatus = 'passed' | 'failed' | 'skipped_external';

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
  claimsFullProductE2E: false;
  claimsRealPiSpawn: false;
};

/** Repo-relative source map for the Batch-B cutover conformance journey. */
export function resolveCrossEndMultiEngineProductStepSources(stepId: string): readonly string[] {
  switch (stepId) {
    case 'ui.mastra_runtime_injection':
      return [
        'packages/app-vue/src/di/keys.ts',
        'packages/app-vue/src/di/types.ts',
        'packages/app-vue/src/modules/ai/composables/useAIChatView.ts',
      ];
    case 'ui.mastra_open_chat':
      return ['packages/app-vue/src/modules/ai/composables/useAIChatSession.ts'];
    case 'ui.legacy_profile_selector_retired':
      return [
        'packages/app-vue/src/modules/ai/components/AIFooterComposer.vue',
        'packages/app-vue/src/modules/ai/composables/useAIChatSession.ts',
      ];
    case 'web.mastra_runtime_client':
      return ['apps/web/src/platform/di-app.ts'];
    case 'desktop.mastra_runtime_client':
      return ['apps/desktop/src/renderer/platform/di-app.ts'];
    case 'transport.http_runtime_surface':
      return [
        'packages/ai/src/client/runtime-assistant.ts',
        'packages/ai/src/api/routes/ai-runtime.routes.ts',
      ];
    case 'transport.ipc_runtime_surface':
      return [
        'packages/ai/src/client/runtime-assistant.ts',
        'packages/ai/src/electron/index.ts',
        'packages/contracts/src/electron/ipc-channels.ts',
      ];
    case 'runtime.one_time_transcript_bootstrap':
      return [
        'packages/ai/src/server/mastra/runtime/assistant-history.service.ts',
        'packages/ai/src/server/infrastructure/migrations/conversation-transcript-bootstrap.source.ts',
      ];
    case 'runtime.restart_persistence':
      return ['packages/ai/src/server/mastra/runtime/assistant-history.persistence.spec.ts'];
    case 'runtime.owner_scoped_delete':
      return [
        'packages/ai/src/server/mastra/runtime/assistant-history.service.ts',
        'packages/app-vue/src/modules/ai/composables/useAIChatSession.ts',
      ];
    case 'runtime.model_usage_metadata':
      return [
        'packages/ai/src/server/mastra/runtime/mastra-ai.runtime.ts',
        'packages/contracts/src/modules/ai/api/ai-runtime.dto.ts',
      ];
    case 'runtime.python_chat_not_composed':
      return ['apps/api/src/runtime/compose-ai.ts', 'apps/desktop/src/main/runtime/compose-ai.ts'];
    case 'ui.workflow_timeline_isolation':
      return [
        'packages/app-vue/src/modules/ai/composables/hostProposalLifecycle.ts',
        'packages/app-vue/src/modules/ai/composables/hostProposalLifecycle.spec.ts',
      ];
    case 'ui.workbench_without_open_chat_engine_badges':
      return [
        'packages/app-vue/src/modules/ai/views/AIChatView.vue',
        'packages/app-vue/src/modules/ai/composables/useAIChatSession.ts',
      ];
    case 'ui.langgraph_diagnostic_sanitization':
      return [
        'packages/app-vue/src/modules/ai/composables/hostLangGraphUiBoundary.ts',
        'packages/app-vue/src/modules/ai/components/AIGoalWorkflowPanel.vue',
      ];
    case 'e2e.playwright_web_full':
      return ['apps/web/e2e/ai/multi-engine-host.spec.ts'];
    case 'e2e.electron_desktop_full':
      return [];
    default:
      return [];
  }
}

function contractSatisfied(sources: readonly string[], contract: string): boolean {
  if (contract.startsWith('!')) {
    const forbidden = contract.slice(1);
    return sources.every((source) => !source.includes(forbidden));
  }
  return sources.some((source) => source.includes(contract));
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
    const missingContracts = step.contracts.filter(
      (contract) => !contractSatisfied(sources, contract),
    );

    results.push({
      stepId: step.id,
      title: step.title,
      status: sourcePaths.length > 0 && missingContracts.length === 0 ? 'passed' : 'failed',
      checkedSources: sourcePaths,
      missingContracts,
    });
  }

  const passed = results.filter((result) => result.status === 'passed').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const skippedExternal = results.filter((result) => result.status === 'skipped_external').length;

  return {
    results,
    passed,
    failed,
    skippedExternal,
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
    unitPathGreen: run.failed === 0,
    claimsFullProductE2E: false,
    claimsRealPiSpawn: false,
  };
}
