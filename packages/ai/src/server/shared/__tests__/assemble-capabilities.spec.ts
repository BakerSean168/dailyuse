import { describe, expect, it } from 'vitest';
import { ADVANCED_AI_REASON, assembleCapabilities } from '../assemble-capabilities';

describe('assembleCapabilities single-runtime projection', () => {
  it('projects the canonical Mastra mode and fails optional capabilities closed', () => {
    const caps = assembleCapabilities('mastra');
    expect(caps.runtimeMode).toBe('mastra');
    expect(caps.supportsChat).toBe(false);
    expect(caps.supportsKnowledgeNotes).toBe(false);
    expect(caps.supportsKnowledgeQuery).toBe(false);
    expect(caps.supportsKnowledgeReindex).toBe(false);
    expect(caps.supportsAnalyticsQuery).toBe(false);
    expect(caps.supportsAssistantRuntime).toBe(false);
    expect(caps.supportsWorkflowRuntime).toBe(false);
    expect(caps.supportsEvaluationReports).toBe(false);
    expect(caps.advancedFeaturesReason).toBe(ADVANCED_AI_REASON);
  });

  it('clears the optional-feature reason when the host supplies every capability', () => {
    const caps = assembleCapabilities('mastra', {
      supportsKnowledgeNotes: true,
      supportsKnowledgeQuery: true,
      supportsAnalyticsQuery: true,
      supportsAssistantRuntime: true,
      supportsWorkflowRuntime: true,
      supportsEvaluationReports: true,
    });
    expect(caps.supportsChat).toBe(true);
    expect(caps.advancedFeaturesReason).toBeUndefined();
    expect(caps.supportsKnowledgeReindex).toBe(true);
  });
});
