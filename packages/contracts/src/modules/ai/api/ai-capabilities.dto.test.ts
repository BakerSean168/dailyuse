import { describe, expect, it } from 'vitest';
import { AICapabilitiesSchema } from './ai-capabilities.dto';

const validCapabilities = {
  runtimeMode: 'remote-ai-service',
  supportsChat: true,
  supportsGoalGeneration: true,
  supportsKnowledgeNotes: false,
  supportsKnowledgeQuery: true,
  supportsKnowledgeReindex: true,
  supportsAnalyticsQuery: true,
  supportsGoalAutomation: true,
  supportsAgentRuntime: true,
  supportsEvaluationReports: false,
};

describe('AI capabilities contract schema', () => {
  it('requires the agent runtime support flag', () => {
    expect(AICapabilitiesSchema.parse(validCapabilities).supportsAgentRuntime).toBe(true);

    const { supportsAgentRuntime: _supportsAgentRuntime, ...missingAgentRuntimeFlag } =
      validCapabilities;

    expect(AICapabilitiesSchema.safeParse(missingAgentRuntimeFlag).success).toBe(false);
  });
});
