import { describe, it, expect, vi } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../../../domain-server';
import type { AIModuleDependencies } from '../../ai.module';
import { createDirectProviderAIRuntime } from '../direct-provider-ai.runtime';

// ============================================================
// Helpers
// ============================================================

function createMockDeps(overrides?: Partial<AIModuleDependencies>): AIModuleDependencies {
  return {
    conversationRepository: createMockRepo<IAIConversationRepository>(),
    providerConfigRepository: createMockRepo<IAIProviderConfigRepository>(),
    ...overrides,
  };
}

// ============================================================
// Tests
// ============================================================

describe('createDirectProviderAIRuntime', () => {
  // --- Capabilities ---

  it('declares runtimeMode as direct-provider', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    expect(runtime.capabilities.runtimeMode).toBe('direct-provider');
  });

  it('always supports chat and goal generation', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    expect(runtime.capabilities.supportsChat).toBe(true);
    expect(runtime.capabilities.supportsGoalGeneration).toBe(true);
  });

  it('does not support knowledge query, analytics, goal automation, or evaluation reports', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    expect(runtime.capabilities.supportsKnowledgeQuery).toBe(false);
    expect(runtime.capabilities.supportsKnowledgeReindex).toBe(false);
    expect(runtime.capabilities.supportsAnalyticsQuery).toBe(false);
    expect(runtime.capabilities.supportsGoalAutomation).toBe(false);
    expect(runtime.capabilities.supportsEvaluationReports).toBe(false);
  });

  it('sets advancedFeaturesReason when advanced features are unavailable', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    expect(runtime.capabilities.advancedFeaturesReason).toBeDefined();
    expect(runtime.capabilities.advancedFeaturesReason).toContain('remote ai-service');
  });

  // --- Knowledge notes (optional) ---

  it('supports knowledge notes when persistence and subpath are provided', () => {
    const runtime = createDirectProviderAIRuntime(
      createMockDeps({
        knowledgeNotePersistence: { saveNote: vi.fn(), loadNote: vi.fn() } as any,
        getKnowledgeNoteSubpath: vi.fn().mockResolvedValue('/notes'),
      }),
    );
    expect(runtime.capabilities.supportsKnowledgeNotes).toBe(true);
    expect(runtime.services.knowledgeNoteService.isAvailable).toBe(true);
  });

  it('does not support knowledge notes when persistence is missing', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    expect(runtime.capabilities.supportsKnowledgeNotes).toBe(false);
    expect(runtime.services.knowledgeNoteService.isAvailable).toBe(false);
  });

  it('does not support knowledge notes when only subpath is provided', () => {
    const runtime = createDirectProviderAIRuntime(
      createMockDeps({
        getKnowledgeNoteSubpath: vi.fn().mockResolvedValue('/notes'),
      }),
    );
    expect(runtime.capabilities.supportsKnowledgeNotes).toBe(false);
  });

  // --- Services ---

  it('always assembles provider, conversation, and chat services', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    expect(runtime.services.providerServices).toBeDefined();
    expect(runtime.services.conversationServices).toBeDefined();
    expect(runtime.services.chatServices).toBeDefined();
  });

  it('always assembles goal generation service', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    expect(runtime.services.goalGenerationService).toBeDefined();
  });

  it('returns unavailable runtime-owned services for advanced features', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    expect(runtime.services.knowledgeIndexServices).toBeNull();
    expect(runtime.services.knowledgeQueryServices.isAvailable).toBe(false);
    expect(runtime.services.analyticsQueryService.isAvailable).toBe(false);
    expect(runtime.services.evaluationReportService.isAvailable).toBe(false);
  });

  // --- Runtime contributions ---

  it('returns empty runtime contributions by default', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    expect(runtime.runtimeContributions).toEqual([]);
  });

  // --- Capability-service consistency ---

  it('capability flags match actual service availability', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    const { capabilities, services } = runtime;

    // Chat and goal always available in direct mode
    expect(capabilities.supportsChat).toBe(Boolean(services.chatServices));
    expect(capabilities.supportsGoalGeneration).toBe(Boolean(services.goalGenerationService));

    // Knowledge notes optional
    expect(capabilities.supportsKnowledgeNotes).toBe(services.knowledgeNoteService.isAvailable);

    // Advanced features not available
    expect(capabilities.supportsKnowledgeQuery).toBe(services.knowledgeQueryServices.isAvailable);
    expect(capabilities.supportsAnalyticsQuery).toBe(services.analyticsQueryService.isAvailable);
    expect(capabilities.supportsGoalAutomation).toBe(false);
    expect(capabilities.supportsEvaluationReports).toBe(
      services.evaluationReportService.isAvailable,
    );
  });
});
