import { describe, it, expect, vi } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { IAIConversationRepository, IAIProviderConfigRepository } from '../../../domain';
import type { AIModuleDependencies } from '../../ai.module';
import { createDirectProviderAIRuntime } from '../direct-provider-ai.runtime';
import { createRemoteAIServiceRuntime } from '../remote-ai-service.runtime';
import {
  assertAgentStartCapabilityPlan,
  buildAgentRuntimeCapabilityOffers,
} from '../ai-runtime';

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
// Tests — cross-runtime capability consistency
// ============================================================

describe('AI runtime capability consistency', () => {
  it('both runtimes produce valid AICapabilities shape', () => {
    const directRuntime = createDirectProviderAIRuntime(createMockDeps());
    const remoteRuntime = createRemoteAIServiceRuntime(createMockDeps());

    for (const runtime of [directRuntime, remoteRuntime]) {
      expect(runtime.capabilities).toHaveProperty('runtimeMode');
      expect(runtime.capabilities).toHaveProperty('supportsChat');
      expect(runtime.capabilities).toHaveProperty('supportsGoalGeneration');
      expect(runtime.capabilities).toHaveProperty('supportsKnowledgeNotes');
      expect(runtime.capabilities).toHaveProperty('supportsKnowledgeQuery');
      expect(runtime.capabilities).toHaveProperty('supportsKnowledgeReindex');
      expect(runtime.capabilities).toHaveProperty('supportsAnalyticsQuery');
      expect(runtime.capabilities).toHaveProperty('supportsGoalAutomation');
      expect(runtime.capabilities).toHaveProperty('supportsAgentRuntime');
      expect(runtime.capabilities).toHaveProperty('supportsEvaluationReports');
    }
  });

  it('both runtimes produce valid services shape', () => {
    const directRuntime = createDirectProviderAIRuntime(createMockDeps());
    const remoteRuntime = createRemoteAIServiceRuntime(createMockDeps());

    for (const runtime of [directRuntime, remoteRuntime]) {
      expect(runtime.services).toHaveProperty('providerServices');
      expect(runtime.services).toHaveProperty('conversationServices');
      expect(runtime.services).toHaveProperty('chatServices');
      expect(runtime.services).toHaveProperty('goalGenerationService');
      expect(runtime.services).toHaveProperty('knowledgeIndexServices');
      expect(runtime.services).toHaveProperty('knowledgeNoteService');
      expect(runtime.services).toHaveProperty('knowledgeQueryServices');
      expect(runtime.services).toHaveProperty('analyticsQueryService');
      expect(runtime.services).toHaveProperty('evaluationReportService');
      expect(runtime.services).toHaveProperty('agentRuntimeService');
    }
  });

  it('supportsKnowledgeReindex always matches supportsKnowledgeQuery', () => {
    const directRuntime = createDirectProviderAIRuntime(createMockDeps());
    const remoteRuntime = createRemoteAIServiceRuntime(
      createMockDeps({
        knowledgeSourcePort: { fetchAllResources: vi.fn() } as any,
        knowledgeIndexRepository: createMockRepo(),
        knowledgeIngestionPort: { ingest: vi.fn() } as any,
        knowledgeQueryPort: { query: vi.fn() } as any,
      }),
    );

    expect(directRuntime.capabilities.supportsKnowledgeReindex).toBe(
      directRuntime.capabilities.supportsKnowledgeQuery,
    );
    expect(remoteRuntime.capabilities.supportsKnowledgeReindex).toBe(
      remoteRuntime.capabilities.supportsKnowledgeQuery,
    );
  });

  it('capability descriptor matches actual service surface', () => {
    const deps = createMockDeps({
      knowledgeSourcePort: { fetchAllResources: vi.fn() } as any,
      knowledgeIndexRepository: createMockRepo(),
      knowledgeIngestionPort: { ingest: vi.fn() } as any,
      knowledgeQueryPort: { query: vi.fn() } as any,
      analyticsReadPort: { read: vi.fn() } as any,
      analyticsQueryPort: { query: vi.fn() } as any,
      goalAutomationPlanningPort: { plan: vi.fn() } as any,
      automationToolExecutorPort: { execute: vi.fn() } as any,
      agentRuntimePort: {
        startRun: vi.fn(),
        resumeRun: vi.fn(),
        getRun: vi.fn(),
        getEvents: vi.fn(),
      } as any,
      knowledgeNotePersistence: { saveNote: vi.fn(), loadNote: vi.fn() } as any,
      evaluationReportPort: { getOverview: vi.fn() } as any,
    });

    const remoteRuntime = createRemoteAIServiceRuntime(deps);
    const { capabilities, services } = remoteRuntime;

    // Every capability flag must match whether the corresponding service is non-null
    expect(capabilities.supportsChat).toBe(Boolean(services.chatServices));
    expect(capabilities.supportsGoalGeneration).toBe(Boolean(services.goalGenerationService));
    expect(capabilities.supportsKnowledgeNotes).toBe(services.knowledgeNoteService.isAvailable);
    expect(capabilities.supportsKnowledgeQuery).toBe(services.knowledgeQueryServices.isAvailable);
    expect(capabilities.supportsAnalyticsQuery).toBe(services.analyticsQueryService.isAvailable);
    expect(capabilities.supportsAgentRuntime).toBe(services.agentRuntimeService.isAvailable);
    expect(capabilities.supportsEvaluationReports).toBe(
      services.evaluationReportService.isAvailable,
    );
  });

  it('direct runtime always has advancedFeaturesReason', () => {
    const runtime = createDirectProviderAIRuntime(createMockDeps());
    // Direct mode never supports advanced features
    expect(runtime.capabilities.advancedFeaturesReason).toBeDefined();
  });

  it('remote runtime with no advanced features still has advancedFeaturesReason', () => {
    const runtime = createRemoteAIServiceRuntime(createMockDeps());
    expect(runtime.capabilities.advancedFeaturesReason).toBeDefined();
  });
});

describe('Agent start capability plan gating', () => {
  it('builds knowledge-write offers only when knowledge note use case is present', () => {
    const without = buildAgentRuntimeCapabilityOffers({});
    expect(without.map((offer) => offer.kind).sort()).toEqual(['tool.proposal']);

    const withNote = buildAgentRuntimeCapabilityOffers({
      knowledgeNoteUseCase: {} as never,
    });
    expect(withNote.map((offer) => offer.kind).sort()).toEqual(
      ['context.cloud_rag', 'tool.mutation', 'tool.proposal'].sort(),
    );
  });

  it('fails closed for knowledge.generate without knowledge note capability offers', () => {
    const result = assertAgentStartCapabilityPlan(
      'knowledge.generate',
      buildAgentRuntimeCapabilityOffers({}),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(result.error.message).toContain('context.cloud_rag');
    }
  });

  it('accepts knowledge.generate when knowledge note offers are present', () => {
    const result = assertAgentStartCapabilityPlan(
      'knowledge.generate',
      buildAgentRuntimeCapabilityOffers({
        knowledgeNoteUseCase: {} as never,
      }),
    );
    expect(result.ok).toBe(true);
  });

  it('does not block goal.create planning at start without automation executor', () => {
    // Mutation for goal.create is enforced at execution.required resolution time.
    const result = assertAgentStartCapabilityPlan(
      'goal.create',
      buildAgentRuntimeCapabilityOffers({}),
    );
    expect(result.ok).toBe(true);
  });
});
