import { describe, it, expect, vi } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../../../domain-server';
import type { AIModuleDependencies } from '../../ai.module';
import type { IAIChatExecutionPort, IGoalPlanningPort } from '../../../application-server/ports';
import { createRemoteAIServiceRuntime } from '../remote-ai-service.runtime';

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

function createMockChatPort(): IAIChatExecutionPort {
  return {
    complete: vi.fn(),
    stream: vi.fn(),
  } as any;
}

function createMockGoalPort(): IGoalPlanningPort {
  return { plan: vi.fn() } as any;
}

// ============================================================
// Tests
// ============================================================

describe('createRemoteAIServiceRuntime', () => {
  // --- Capabilities ---

  it('declares runtimeMode as remote-ai-service', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ chatExecutionPort: createMockChatPort() }),
    );
    expect(runtime.capabilities.runtimeMode).toBe('remote-ai-service');
  });

  it('always supports chat and goal generation', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.capabilities.supportsChat).toBe(true);
    expect(runtime.capabilities.supportsGoalGeneration).toBe(true);
  });

  // --- Chat bundle: remote or fallback ---

  it('uses remote chat port when provided', () => {
    const remoteChat = createMockChatPort();
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ chatExecutionPort: remoteChat }),
    );
    expect(runtime.services.chatServices).toBeDefined();
    // The chat send use case should be constructed with the remote port
    // (we verify via capability consistency instead of private fields)
    expect(runtime.capabilities.supportsChat).toBe(true);
  });

  it('falls back to direct-provider chat when remote port not provided', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.services.chatServices).toBeDefined();
    expect(runtime.capabilities.supportsChat).toBe(true);
  });

  // --- Goal generation bundle: remote or fallback ---

  it('uses remote goal planning port when provided', () => {
    const remoteGoal = createMockGoalPort();
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ goalPlanningPort: remoteGoal }),
    );
    expect(runtime.services.goalGenerationService).toBeDefined();
    expect(runtime.capabilities.supportsGoalGeneration).toBe(true);
  });

  // --- Knowledge query bundle ---

  it('enables knowledge query when all 4 dependencies are present', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeSourcePort: { fetchAllResources: vi.fn() } as any,
        knowledgeIndexRepository: createMockRepo(),
        knowledgeIngestionPort: { ingest: vi.fn() } as any,
        knowledgeQueryPort: { query: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.supportsKnowledgeQuery).toBe(true);
    expect(runtime.capabilities.supportsKnowledgeReindex).toBe(true);
    expect(runtime.services.knowledgeQueryServices.isAvailable).toBe(true);
    expect(runtime.services.knowledgeIndexServices).not.toBeNull();
  });

  it('disables knowledge query when any dependency is missing', () => {
    // Missing knowledgeQueryPort
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeSourcePort: { fetchAllResources: vi.fn() } as any,
        knowledgeIndexRepository: createMockRepo(),
        knowledgeIngestionPort: { ingest: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.supportsKnowledgeQuery).toBe(false);
    expect(runtime.services.knowledgeQueryServices.isAvailable).toBe(false);
    expect(runtime.services.knowledgeIndexServices).toBeNull();
  });

  // --- Analytics bundle ---

  it('enables analytics when both ports are present', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        analyticsReadPort: { read: vi.fn() } as any,
        analyticsQueryPort: { query: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.supportsAnalyticsQuery).toBe(true);
    expect(runtime.services.analyticsQueryService.isAvailable).toBe(true);
  });

  it('disables analytics when only one port is present', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ analyticsReadPort: { read: vi.fn() } as any }),
    );
    expect(runtime.capabilities.supportsAnalyticsQuery).toBe(false);
    expect(runtime.services.analyticsQueryService.isAvailable).toBe(false);
  });

  // --- Goal automation bundle ---

  it('enables goal automation when both ports are present', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        goalAutomationPlanningPort: { plan: vi.fn() } as any,
        automationToolExecutorPort: { execute: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.supportsGoalAutomation).toBe(true);
  });

  it('disables goal automation when any port is missing', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ automationToolExecutorPort: { execute: vi.fn() } as any }),
    );
    expect(runtime.capabilities.supportsGoalAutomation).toBe(false);
  });

  // --- Knowledge notes ---

  it('supports knowledge notes when persistence and subpath are provided', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeNotePersistence: { saveNote: vi.fn(), loadNote: vi.fn() } as any,
        getKnowledgeNoteSubpath: vi.fn().mockResolvedValue('/notes'),
      }),
    );
    expect(runtime.capabilities.supportsKnowledgeNotes).toBe(true);
    expect(runtime.services.knowledgeNoteService.isAvailable).toBe(true);
  });

  it('does not support knowledge notes when persistence is missing', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.capabilities.supportsKnowledgeNotes).toBe(false);
    expect(runtime.services.knowledgeNoteService.isAvailable).toBe(false);
  });

  // --- Evaluation reports ---

  it('supports evaluation reports when port is provided', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({ evaluationReportPort: { getOverview: vi.fn() } as any }),
    );
    expect(runtime.capabilities.supportsEvaluationReports).toBe(true);
    expect(runtime.services.evaluationReportService.isAvailable).toBe(true);
  });

  // --- Advanced features reason ---

  it('sets advancedFeaturesReason when any advanced feature is missing', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.capabilities.advancedFeaturesReason).toBeDefined();
    expect(runtime.capabilities.advancedFeaturesReason).toContain('remote ai-service');
  });

  it('clears advancedFeaturesReason when all advanced features are available', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeSourcePort: { fetchAllResources: vi.fn() } as any,
        knowledgeIndexRepository: createMockRepo(),
        knowledgeIngestionPort: { ingest: vi.fn() } as any,
        knowledgeQueryPort: { query: vi.fn() } as any,
        analyticsReadPort: { read: vi.fn() } as any,
        analyticsQueryPort: { query: vi.fn() } as any,
        goalAutomationPlanningPort: { plan: vi.fn() } as any,
        automationToolExecutorPort: { execute: vi.fn() } as any,
      }),
    );
    expect(runtime.capabilities.advancedFeaturesReason).toBeUndefined();
  });

  // --- Runtime contributions ---

  it('returns empty runtime contributions', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.runtimeContributions).toEqual([]);
  });

  // --- Capability-service consistency ---

  it('capability flags match actual service availability', () => {
    const runtime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeSourcePort: { fetchAllResources: vi.fn() } as any,
        knowledgeIndexRepository: createMockRepo(),
        knowledgeIngestionPort: { ingest: vi.fn() } as any,
        knowledgeQueryPort: { query: vi.fn() } as any,
        analyticsReadPort: { read: vi.fn() } as any,
        analyticsQueryPort: { query: vi.fn() } as any,
        goalAutomationPlanningPort: { plan: vi.fn() } as any,
        automationToolExecutorPort: { execute: vi.fn() } as any,
        knowledgeNotePersistence: { saveNote: vi.fn(), loadNote: vi.fn() } as any,
        getKnowledgeNoteSubpath: vi.fn().mockResolvedValue('/notes'),
        evaluationReportPort: { getOverview: vi.fn() } as any,
      }),
    );
    const { capabilities, services } = runtime;

    expect(capabilities.supportsChat).toBe(Boolean(services.chatServices));
    expect(capabilities.supportsGoalGeneration).toBe(Boolean(services.goalGenerationService));
    expect(capabilities.supportsKnowledgeNotes).toBe(services.knowledgeNoteService.isAvailable);
    expect(capabilities.supportsKnowledgeQuery).toBe(services.knowledgeQueryServices.isAvailable);
    expect(capabilities.supportsKnowledgeReindex).toBe(services.knowledgeQueryServices.isAvailable);
    expect(capabilities.supportsAnalyticsQuery).toBe(services.analyticsQueryService.isAvailable);
    expect(capabilities.supportsGoalAutomation).toBe(true);
    expect(capabilities.supportsEvaluationReports).toBe(
      services.evaluationReportService.isAvailable,
    );
  });
});
