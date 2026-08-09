import type { AICapabilities, AIRuntimeMode } from '@memoflow/contracts/ai';

/**
 * Shared reason shown when advanced AI features are unavailable.
 * Kept in the shared capability assembly so direct and remote runtimes
 * expose the same explanation (AH-7: single capability projection).
 */
export const ADVANCED_AI_REASON =
  'Advanced AI features require a remote ai-service runtime. Configure AI_SERVICE_BASE_URL and AI_SERVICE_SECRET to enable goal automation, knowledge retrieval, analytics, and reindexing.';

export interface CapabilityAssemblyInput {
  supportsKnowledgeNotes?: boolean;
  supportsKnowledgeQuery?: boolean;
  supportsAnalyticsQuery?: boolean;
  supportsGoalAutomation?: boolean;
  supportsAgentRuntime?: boolean;
  supportsEvaluationReports?: boolean;
  /**
   * When true, clears `advancedFeaturesReason` as soon as every advanced
   * feature is available (remote runtime behavior). Direct runtime keeps the
   * reason unconditionally, so it omits this flag.
   */
  clearAdvancedReasonWhenComplete?: boolean;
}

/**
 * Single capability projection shared by all AI runtimes (AH-7).
 *
 * Both runtimes previously declared their own `AICapabilities` literals with
 * subtly different shapes; this function centralizes the assembly so the
 * capability surface stays consistent and fail-closed by default.
 */
export function assembleCapabilities(
  runtimeMode: AIRuntimeMode,
  input: CapabilityAssemblyInput = {},
): AICapabilities {
  const supportsKnowledgeQuery = Boolean(input.supportsKnowledgeQuery);
  const supportsAnalyticsQuery = Boolean(input.supportsAnalyticsQuery);
  const supportsGoalAutomation = Boolean(input.supportsGoalAutomation);
  const supportsAgentRuntime = Boolean(input.supportsAgentRuntime);

  const allAdvancedAvailable =
    supportsKnowledgeQuery && supportsAnalyticsQuery && supportsGoalAutomation && supportsAgentRuntime;

  return {
    runtimeMode,
    supportsChat: true,
    supportsGoalGeneration: true,
    supportsKnowledgeNotes: Boolean(input.supportsKnowledgeNotes),
    supportsKnowledgeQuery,
    supportsKnowledgeReindex: supportsKnowledgeQuery,
    supportsAnalyticsQuery,
    supportsGoalAutomation,
    supportsAgentRuntime,
    supportsEvaluationReports: Boolean(input.supportsEvaluationReports),
    advancedFeaturesReason:
      input.clearAdvancedReasonWhenComplete && allAdvancedAvailable ? undefined : ADVANCED_AI_REASON,
  };
}
