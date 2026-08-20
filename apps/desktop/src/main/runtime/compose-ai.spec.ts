import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@memoflow/ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/ai')>();
  return {
    ...actual,
    AIEvaluationReportFileAdapter: vi.fn(),
    AIServiceAgentRuntimeAdapter: vi.fn(),
    AIServiceAnalyticsQueryAdapter: vi.fn(),
    AIServiceChatExecutionAdapter: vi.fn(),
    AIServiceGoalAutomationAdapter: vi.fn(),
    AIServiceGoalPlanningAdapter: vi.fn(),
    AIServiceKnowledgeIngestionAdapter: vi.fn(),
    AIServiceKnowledgeNoteGenerationAdapter: vi.fn(),
    AIServiceKnowledgeQueryAdapter: vi.fn(),
    createAIModule: vi.fn(),
    createAIPowerSyncRepositories: vi.fn(),
    createMastraStorage: vi.fn(() => ({ tag: 'desktop-mastra-storage' })),
    ConversationTranscriptBootstrapSource: vi.fn(
      function ConversationTranscriptBootstrapSourceMock() {
        return { tag: 'desktop-transcript-bootstrap-source' };
      },
    ),
    MastraModelResolver: vi.fn(function MastraModelResolverMock() {
      return { tag: 'desktop-mastra-model-resolver' };
    }),
    MastraAIRuntime: vi.fn(function MastraAIRuntimeMock(input: unknown) {
      return { tag: 'desktop-mastra-runtime', input };
    }),
  };
});

vi.mock('@memoflow/ai/electron', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/ai/electron')>();
  return {
    ...actual,
    createAIElectronModule: vi.fn(),
  };
});

import {
  AIEvaluationReportFileAdapter,
  AIServiceAgentRuntimeAdapter,
  AIServiceAnalyticsQueryAdapter,
  AIServiceChatExecutionAdapter,
  AIServiceGoalAutomationAdapter,
  AIServiceGoalPlanningAdapter,
  AIServiceKnowledgeIngestionAdapter,
  AIServiceKnowledgeNoteGenerationAdapter,
  AIServiceKnowledgeQueryAdapter,
  createAIModule,
  createAIPowerSyncRepositories,
  createMastraStorage,
  ConversationTranscriptBootstrapSource,
  MastraAIRuntime,
  MastraModelResolver,
  type AIServiceRuntimeConfig,
} from '@memoflow/ai';
import { createAIElectronModule } from '@memoflow/ai/electron';
import { composeAI } from './compose-ai';

const db = { tag: 'desktop-db' } as never;
const knowledgeNotePersistence = { tag: 'knowledge-persistence' } as never;
const knowledgeSourcePort = { tag: 'knowledge-source' } as never;
const analyticsReadPort = { tag: 'analytics-read' } as never;
const automationToolExecutor = { tag: 'automation-executor' } as never;
const mastraStorage = {
  kind: 'libsql' as const,
  url: 'file:///profiles/profile-1/storage/mastra.db',
};

const repositorySet = {
  conversationRepository: { tag: 'conversation-repository' },
  providerConfigRepository: { tag: 'provider-repository' },
  knowledgeIndexRepository: { tag: 'knowledge-index-repository' },
  executionLogPort: { tag: 'execution-log' },
};

const dependencies = {
  db,
  knowledgeNotePersistence,
  knowledgeSourcePort,
  analyticsReadPort,
  automationToolExecutor,
  mastraStorage,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createAIPowerSyncRepositories).mockReturnValue(
    repositorySet as ReturnType<typeof createAIPowerSyncRepositories>,
  );
  vi.mocked(createAIModule).mockReturnValue({
    api: {},
    start: vi.fn(),
    dispose: vi.fn(),
  } as ReturnType<typeof createAIModule>);
  vi.mocked(createAIElectronModule).mockReturnValue({
    name: 'AI',
    register: vi.fn(),
    destroy: vi.fn(),
  });
});

describe('desktop composeAI Mastra ownership', () => {
  it('composes one profile-local LibSQL Mastra runtime from the same identity-scoped provider repository', () => {
    composeAI(dependencies);

    expect(createAIPowerSyncRepositories).toHaveBeenCalledTimes(1);
    expect(createAIPowerSyncRepositories).toHaveBeenCalledWith(db);
    expect(createMastraStorage).toHaveBeenCalledTimes(1);
    expect(createMastraStorage).toHaveBeenCalledWith(mastraStorage);
    expect(MastraModelResolver).toHaveBeenCalledTimes(1);
    expect(MastraModelResolver).toHaveBeenCalledWith(repositorySet.providerConfigRepository);

    const storage = vi.mocked(createMastraStorage).mock.results[0].value;
    const resolver = vi.mocked(MastraModelResolver).mock.results[0].value;
    expect(ConversationTranscriptBootstrapSource).toHaveBeenCalledTimes(1);
    expect(ConversationTranscriptBootstrapSource).toHaveBeenCalledWith(
      repositorySet.conversationRepository,
    );
    const transcriptBootstrapSource = vi.mocked(ConversationTranscriptBootstrapSource).mock
      .results[0].value;
    expect(MastraAIRuntime).toHaveBeenCalledTimes(1);
    expect(MastraAIRuntime).toHaveBeenCalledWith({
      storage,
      modelResolver: resolver,
      transcriptBootstrapSource,
    });

    const runtime = vi.mocked(MastraAIRuntime).mock.results[0].value;
    expect(vi.mocked(createAIModule).mock.calls[0][0].mastraRuntime).toBe(runtime);
  });

  it('passes the exact Desktop-owned domain capability ports into the transport-neutral AI module', () => {
    composeAI(dependencies);

    const moduleInput = vi.mocked(createAIModule).mock.calls[0][0];
    expect(moduleInput.conversationRepository).toBe(repositorySet.conversationRepository);
    expect(moduleInput.providerConfigRepository).toBe(repositorySet.providerConfigRepository);
    expect(moduleInput.knowledgeIndexRepository).toBe(repositorySet.knowledgeIndexRepository);
    expect(moduleInput.executionLogPort).toBe(repositorySet.executionLogPort);
    expect(moduleInput.knowledgeNotePersistence).toBe(knowledgeNotePersistence);
    expect(moduleInput.knowledgeSourcePort).toBe(knowledgeSourcePort);
    expect(moduleInput.analyticsReadPort).toBe(analyticsReadPort);
    expect(moduleInput.automationToolExecutorPort).toBe(automationToolExecutor);

    const instance = vi.mocked(createAIModule).mock.results[0].value;
    expect(createAIElectronModule).toHaveBeenCalledWith({ instance });
  });

  it('keeps legacy service adapters optional while Mastra runtime stays mandatory during migration', () => {
    composeAI(dependencies);

    const moduleInput = vi.mocked(createAIModule).mock.calls[0][0];
    for (const key of [
      'chatExecutionPort',
      'goalPlanningPort',
      'goalAutomationPlanningPort',
      'knowledgeIngestionPort',
      'knowledgeQueryPort',
      'knowledgeNoteGenerationPort',
      'analyticsQueryPort',
      'agentRuntimePort',
    ] as const) {
      expect(moduleInput[key]).toBeUndefined();
    }
    expect(moduleInput.mastraRuntime).toBeDefined();
  });

  it('uses one injected legacy service config consistently until Batch F deletes those adapters', () => {
    const config: AIServiceRuntimeConfig = {
      baseUrl: 'http://legacy-ai.internal',
      serviceSecret: 'test-secret',
      serviceName: 'desktop-test',
      timeoutMs: 1000,
    };

    composeAI({ ...dependencies, aiServiceRuntimeConfig: config });

    expect(AIServiceChatExecutionAdapter).not.toHaveBeenCalled();
    expect(vi.mocked(createAIModule).mock.calls[0][0].chatExecutionPort).toBeUndefined();

    for (const adapter of [
      AIServiceGoalPlanningAdapter,
      AIServiceGoalAutomationAdapter,
      AIServiceKnowledgeIngestionAdapter,
      AIServiceKnowledgeQueryAdapter,
      AIServiceKnowledgeNoteGenerationAdapter,
      AIServiceAnalyticsQueryAdapter,
      AIServiceAgentRuntimeAdapter,
    ]) {
      expect(vi.mocked(adapter)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(adapter)).toHaveBeenCalledWith(config);
    }
    expect(AIEvaluationReportFileAdapter).toHaveBeenCalledTimes(1);
  });
});
