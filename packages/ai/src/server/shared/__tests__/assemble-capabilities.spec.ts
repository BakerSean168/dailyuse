import { describe, expect, it } from 'vitest';
import {
  ADVANCED_AI_REASON,
  assembleCapabilities,
} from '../assemble-capabilities';

describe('assembleCapabilities (AH-7 single capability projection)', () => {
  it('projects direct-provider mode with only basic features (fail-closed)', () => {
    const caps = assembleCapabilities('direct-provider', {
      supportsKnowledgeNotes: false,
    });

    expect(caps.runtimeMode).toBe('direct-provider');
    expect(caps.supportsChat).toBe(true);
    expect(caps.supportsGoalGeneration).toBe(true);
    expect(caps.supportsKnowledgeNotes).toBe(false);
    expect(caps.supportsKnowledgeQuery).toBe(false);
    expect(caps.supportsKnowledgeReindex).toBe(false);
    expect(caps.supportsAnalyticsQuery).toBe(false);
    expect(caps.supportsGoalAutomation).toBe(false);
    expect(caps.supportsAgentRuntime).toBe(false);
    expect(caps.supportsEvaluationReports).toBe(false);
    expect(caps.advancedFeaturesReason).toBe(ADVANCED_AI_REASON);
  });

  it('keeps advancedFeaturesReason in direct mode even when flags are set (no auto-clear)', () => {
    const caps = assembleCapabilities('direct-provider', {
      supportsKnowledgeQuery: true,
      supportsAnalyticsQuery: true,
      supportsGoalAutomation: true,
      supportsAgentRuntime: true,
    });

    expect(caps.advancedFeaturesReason).toBe(ADVANCED_AI_REASON);
  });

  it('clears advancedFeaturesReason when every advanced feature is available (remote behavior)', () => {
    const caps = assembleCapabilities('remote-ai-service', {
      supportsKnowledgeQuery: true,
      supportsAnalyticsQuery: true,
      supportsGoalAutomation: true,
      supportsAgentRuntime: true,
      supportsEvaluationReports: true,
      clearAdvancedReasonWhenComplete: true,
    });

    expect(caps.runtimeMode).toBe('remote-ai-service');
    expect(caps.supportsKnowledgeQuery).toBe(true);
    expect(caps.supportsKnowledgeReindex).toBe(true);
    expect(caps.advancedFeaturesReason).toBeUndefined();
  });

  it('keeps advancedFeaturesReason when any advanced feature is missing (remote behavior)', () => {
    const caps = assembleCapabilities('remote-ai-service', {
      supportsKnowledgeQuery: true,
      supportsAnalyticsQuery: false,
      supportsGoalAutomation: true,
      supportsAgentRuntime: true,
      clearAdvancedReasonWhenComplete: true,
    });

    expect(caps.advancedFeaturesReason).toBe(ADVANCED_AI_REASON);
  });

  it('defaults every advanced flag to false when input is omitted', () => {
    const caps = assembleCapabilities('direct-provider');

    expect(caps.supportsKnowledgeQuery).toBe(false);
    expect(caps.supportsAnalyticsQuery).toBe(false);
    expect(caps.supportsGoalAutomation).toBe(false);
    expect(caps.supportsAgentRuntime).toBe(false);
    expect(caps.supportsEvaluationReports).toBe(false);
  });
});
