import { describe, expect, it, vi } from 'vitest';
import { REPOSITORY_RESOURCE_MUTATED_EVENT, RepositoryResourceMutationType } from '@dailyuse/contracts/repository';
import { eventBus } from '@dailyuse/utils/domain';

import {
  AIProviderType,
  type ExpandKnowledgeReq,
  type QueryAnalyticsReq,
  type QueryKnowledgeReq,
} from '@dailyuse/contracts/ai';

import type { IAIProviderConfigRepository } from '../../../../domain-server/repositories/i-ai-provider-config-repository';
import type {
  AIExecutionLogInput,
  AnalyticsQueryContext,
  AnalyticsQueryInput,
  AnalyticsQueryResult,
  IAIExecutionLogPort,
  IAnalyticsQueryPort,
  IAnalyticsReadPort,
  IKnowledgeIndexRepository,
  IKnowledgeIngestionPort,
  IKnowledgeQueryPort,
  IKnowledgeSourcePort,
  KnowledgeIndexDiagnostics,
  KnowledgeExpansionInput,
  KnowledgeExpansionResult,
  KnowledgeIngestionInput,
  KnowledgeIndexedResource,
  KnowledgeQueryInput,
  KnowledgeQueryResult,
  KnowledgeSourceResource,
} from '../../../ports';
import { QueryAIAnalyticsUseCase } from '../query-ai-analytics.use-case';
import { SyncRelevantKnowledgeUseCase } from '../sync-relevant-knowledge.use-case';
import { ReindexAllKnowledgeUseCase } from '../reindex-all-knowledge.use-case';
import { QueryKnowledgeUseCase } from '../query-knowledge.use-case';
import { ExpandKnowledgeUseCase } from '../expand-knowledge.use-case';
import { ReindexKnowledgeUseCase } from '../reindex-knowledge.use-case';
import {
  createAIModuleForTests,
  createAIProviderConfigRepositoryStub,
  createAIProviderConfigServerDTO,
} from '../../../../testing';

class StubProviderConfigRepository {
  constructor(
    private readonly providers: Array<{
      id: string;
      identityId: string;
      providerType: string;
      baseUrl: string;
      apiKey: string;
      defaultModel: string | null;
      isActive: boolean;
      isDefault?: boolean;
      name: string;
    }>,
  ) {}

  async findById(id: string) {
    return this.providers.find((provider) => provider.id === id) ?? null;
  }

  async findDefaultByIdentityId(identityId: string) {
    return (
      this.providers.find(
        (provider) => provider.identityId === identityId && provider.isDefault,
      ) ?? null
    );
  }

  async findByIdentityId(identityId: string) {
    return this.providers.filter((provider) => provider.identityId === identityId);
  }
}

class StubKnowledgeSourcePort implements IKnowledgeSourcePort {
  public readonly getResourceById = vi.fn<
    (identityId: string, resourceId: string) => Promise<KnowledgeSourceResource | null>
  >(async (identityId, resourceId) => ({
    identityId,
    repositoryId: 'repo-1',
    resourceId,
    resourcePath: resourceId === 'resource-1' ? 'notes/python-ai.md' : `notes/${resourceId}.md`,
    title: resourceId === 'resource-1' ? 'Python AI' : resourceId,
    mimeType: 'text/markdown',
    content: 'Repository-backed answers are enabled.',
    metadata: {},
  }));

  public readonly listRelevantResources = vi.fn<
    (identityId: string, query: string, limit: number) => Promise<KnowledgeSourceResource[]>
  >(async () => [
    {
      identityId: 'identity-1',
      repositoryId: 'repo-1',
      resourceId: 'resource-1',
      resourcePath: 'notes/python-ai.md',
      title: 'Python AI',
      mimeType: 'text/markdown',
      content: 'Repository-backed answers are enabled.',
      metadata: {},
    },
  ]);

  public readonly listIndexableResources = vi.fn<
    (identityId: string, limit: number) => Promise<KnowledgeSourceResource[]>
  >(async (identityId, limit) => this.listRelevantResources(identityId, '', limit));
}

class StubKnowledgeIngestionPort implements IKnowledgeIngestionPort {
  public readonly indexResource = vi.fn<
    (input: KnowledgeIngestionInput) => Promise<KnowledgeIndexedResource>
  >(async (input) => ({
    identityId: input.resource.identityId,
    repositoryId: input.resource.repositoryId,
    resourceId: input.resource.resourceId,
    resourcePath: input.resource.resourcePath,
    title: input.resource.title,
    mimeType: input.resource.mimeType,
    contentHash: 'hash-1',
    summary: 'Repository-backed answers are enabled.',
    keywords: ['repository', 'answers'],
    embedding: [0.2, 0.8],
    chunks: [
      {
        chunkIndex: 0,
        content: input.resource.content,
        contentHash: 'hash-1',
        startOffset: 0,
        endOffset: input.resource.content.length,
        headingPath: ['Python AI'],
        keywords: ['repository', 'answers'],
        embedding: [0.2, 0.8],
      },
    ],
    metadata: input.resource.metadata ?? {},
  }));
}

class StubKnowledgeQueryPort implements IKnowledgeQueryPort {
  public readonly expand = vi.fn<
    (input: KnowledgeExpansionInput) => Promise<KnowledgeExpansionResult>
  >(async () => ({
    expandedContent: '# Expanded Note\n\nGrounded answers should cite repository resources.',
    citations: [
      {
        resourceId: 'resource-1',
        resourcePath: 'notes/python-ai.md',
        title: 'Python AI',
        chunkIndex: 0,
        excerpt: 'Repository-backed answers are enabled.',
        score: 2,
      },
    ],
    usage: {
      promptTokens: 22,
      completionTokens: 14,
      totalTokens: 36,
    },
  }));

  public readonly query = vi.fn<
    (input: KnowledgeQueryInput) => Promise<KnowledgeQueryResult>
  >(async () => ({
    answer: 'The repository notes confirm that grounded answers are enabled.',
    citations: [
      {
        resourceId: 'resource-1',
        resourcePath: 'notes/python-ai.md',
        title: 'Python AI',
        chunkIndex: 0,
        excerpt: 'Repository-backed answers are enabled.',
        score: 2,
      },
    ],
    usage: {
      promptTokens: 20,
      completionTokens: 10,
      totalTokens: 30,
    },
  }));
}

class StubKnowledgeIndexRepository implements IKnowledgeIndexRepository {
  public readonly getDiagnostics = vi.fn<() => Promise<KnowledgeIndexDiagnostics>>(async () => ({
    persistenceBackend: 'prisma-index-table',
    persistenceStatus: 'enabled',
    vectorRecallBackend: 'local-js-hybrid',
    vectorRecallStatus: 'unknown',
    vectorRecallReason: 'Vector availability has not been probed in this test stub.',
  }));

  public readonly findByResourceIds = vi.fn<
    (identityId: string, resourceIds: string[]) => Promise<KnowledgeIndexedResource[]>
  >(async () => []);

  public readonly findRelevantResources = vi.fn<
    (identityId: string, query: string, limit: number) => Promise<KnowledgeIndexedResource[]>
  >(async () => []);

  public readonly upsert = vi.fn<(resource: KnowledgeIndexedResource) => Promise<void>>(async () => {});

  public readonly markRequested = vi.fn<
    (identityId: string, resourceIds: string[], requestedAt: number) => Promise<void>
  >(async () => {});

  public readonly markFailed = vi.fn(async () => {});
}

class StubExecutionLogPort implements IAIExecutionLogPort {
  public readonly record = vi.fn<(input: AIExecutionLogInput) => Promise<void>>(async () => {});
}

class StubAnalyticsReadPort implements IAnalyticsReadPort {
  public readonly buildContext = vi.fn<
    (identityId: string, question: string) => Promise<AnalyticsQueryContext>
  >(async () => ({
    dashboard: { stats: { activeGoals: 4 } },
    taskDashboard: { summary: { overdue: 2 } },
    goals: [],
    goalSearchResults: [],
    extra: {},
  }));
}

class StubAnalyticsQueryPort implements IAnalyticsQueryPort {
  public readonly query = vi.fn<
    (input: AnalyticsQueryInput) => Promise<AnalyticsQueryResult>
  >(async () => ({
    answer: 'Focus on the overdue tasks first.',
    highlights: ['activeGoals: 4', 'task.overdue: 2'],
    usage: {
      promptTokens: 18,
      completionTokens: 8,
      totalTokens: 26,
    },
  }));
}

describe('AIKnowledgeQueryService', () => {
  it('reads resources, indexes them, and queries through the knowledge execution ports', async () => {
    const sourcePort = new StubKnowledgeSourcePort();
    const knowledgeIndexRepository = new StubKnowledgeIndexRepository();
    const ingestionPort = new StubKnowledgeIngestionPort();
    const queryPort = new StubKnowledgeQueryPort();
    const executionLogPort = new StubExecutionLogPort();
    const syncRelevant = new SyncRelevantKnowledgeUseCase(
      sourcePort,
      knowledgeIndexRepository,
      ingestionPort,
      executionLogPort,
    );
    const service = new QueryKnowledgeUseCase(
      new StubProviderConfigRepository([
        {
          id: 'provider-1',
          identityId: 'identity-1',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'plain-secret',
          defaultModel: 'gpt-4o-mini',
          isActive: true,
          isDefault: true,
          name: 'Main provider',
        },
      ]) as unknown as IAIProviderConfigRepository,
      syncRelevant,
      queryPort,
      executionLogPort,
    );

    const result = await service.execute({
      query: 'How does knowledge grounding work?',
    } satisfies QueryKnowledgeReq, { identityId: 'identity-1' });

    expect(sourcePort.listRelevantResources).toHaveBeenCalledWith(
      'identity-1',
      'How does knowledge grounding work?',
      32,
    );
    expect(ingestionPort.indexResource).toHaveBeenCalledTimes(1);
    expect(ingestionPort.indexResource).toHaveBeenCalledWith(
      expect.objectContaining({
        providerConfig: expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      }),
    );
    expect(knowledgeIndexRepository.upsert).toHaveBeenCalledTimes(1);
    expect(queryPort.query).toHaveBeenCalledTimes(1);
    expect(executionLogPort.record).toHaveBeenCalledTimes(2);
    expect(queryPort.query).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: expect.any(String),
        providerConfig: expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      }),
    );
    for (const [call] of executionLogPort.record.mock.calls) {
      expect(call).toEqual(
        expect.objectContaining({
          requestId: expect.any(String),
        }),
      );
    }
    expect(executionLogPort.record.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        costEstimate: expect.objectContaining({
          pricingModel: 'gpt-4o-mini',
          totalCostUsd: expect.any(Number),
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.answer).toContain('grounded');
    expect(result.data.citations[0]?.resourcePath).toBe('notes/python-ai.md');
    expect(result.data.providerId).toBe('provider-1');
    expect(result.data.matchedResourceCount).toBe(1);
  });

  it('backs off to broader indexable resources when lexical prefilter recall is too narrow', async () => {
    const sourcePort = new StubKnowledgeSourcePort();
    sourcePort.listRelevantResources.mockResolvedValueOnce([]);
    sourcePort.listIndexableResources.mockResolvedValueOnce([
      {
        identityId: 'identity-1',
        repositoryId: 'repo-1',
        resourceId: 'resource-1',
        resourcePath: 'notes/repository-grounding.md',
        title: 'Repository Grounding',
        mimeType: 'text/markdown',
        content: 'Grounded answers cite repository resources after retrieval.',
        metadata: {},
      },
    ]);
    const knowledgeIndexRepository = new StubKnowledgeIndexRepository();
    const ingestionPort = new StubKnowledgeIngestionPort();
    const queryPort = new StubKnowledgeQueryPort();
    const executionLogPort = new StubExecutionLogPort();
    const syncRelevant = new SyncRelevantKnowledgeUseCase(
      sourcePort,
      knowledgeIndexRepository,
      ingestionPort,
      executionLogPort,
    );
    const service = new QueryKnowledgeUseCase(
      new StubProviderConfigRepository([
        {
          id: 'provider-1',
          identityId: 'identity-1',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'plain-secret',
          defaultModel: 'gpt-4o-mini',
          isActive: true,
          isDefault: true,
          name: 'Main provider',
        },
      ]) as unknown as IAIProviderConfigRepository,
      syncRelevant,
      queryPort,
      executionLogPort,
    );

    const result = await service.execute({
      query: 'How does grounding from repos cite sources?',
    } satisfies QueryKnowledgeReq, { identityId: 'identity-1' });

    expect(sourcePort.listRelevantResources).toHaveBeenCalledWith(
      'identity-1',
      'How does grounding from repos cite sources?',
      32,
    );
    expect(sourcePort.listIndexableResources).toHaveBeenCalledWith('identity-1', 32);
    expect(queryPort.query).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.answer).toContain('grounded');
  });

  it('prefers indexed retrieval-layer candidates before falling back to raw repository lexical search', async () => {
    const sourcePort = new StubKnowledgeSourcePort();
    const knowledgeIndexRepository = new StubKnowledgeIndexRepository();
    knowledgeIndexRepository.findRelevantResources.mockResolvedValueOnce(
      Array.from({ length: 6 }, (_, index) => ({
        identityId: 'identity-1',
        repositoryId: 'repo-1',
        resourceId: `resource-${index + 1}`,
        resourcePath: `notes/resource-${index + 1}.md`,
        title: `Indexed Resource ${index + 1}`,
        mimeType: 'text/markdown',
        contentHash: `hash-${index + 1}`,
        summary: 'Indexed repository grounding guidance.',
        keywords: ['grounding', 'citation'],
        embedding: [0.2, 0.8],
        chunks: [],
        metadata: {},
      })),
    );
    const ingestionPort = new StubKnowledgeIngestionPort();
    const queryPort = new StubKnowledgeQueryPort();
    const executionLogPort = new StubExecutionLogPort();
    const syncRelevant = new SyncRelevantKnowledgeUseCase(
      sourcePort,
      knowledgeIndexRepository,
      ingestionPort,
      executionLogPort,
    );
    const service = new QueryKnowledgeUseCase(
      new StubProviderConfigRepository([
        {
          id: 'provider-1',
          identityId: 'identity-1',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'plain-secret',
          defaultModel: 'gpt-4o-mini',
          isActive: true,
          isDefault: true,
          name: 'Main provider',
        },
      ]) as unknown as IAIProviderConfigRepository,
      syncRelevant,
      queryPort,
      executionLogPort,
    );

    await service.execute({
      query: 'How does repository grounding work?',
    } satisfies QueryKnowledgeReq, { identityId: 'identity-1' });

    expect(knowledgeIndexRepository.findRelevantResources).toHaveBeenCalledWith(
      'identity-1',
      'How does repository grounding work?',
      32,
    );
    expect(sourcePort.getResourceById).toHaveBeenCalledTimes(6);
    expect(sourcePort.listRelevantResources).not.toHaveBeenCalled();
    expect(sourcePort.listIndexableResources).not.toHaveBeenCalled();
  });

  it('expands knowledge drafts through the shared retrieval execution port', async () => {
    const sourcePort = new StubKnowledgeSourcePort();
    const knowledgeIndexRepository = new StubKnowledgeIndexRepository();
    const ingestionPort = new StubKnowledgeIngestionPort();
    const queryPort = new StubKnowledgeQueryPort();
    const executionLogPort = new StubExecutionLogPort();
    const syncRelevant = new SyncRelevantKnowledgeUseCase(
      sourcePort,
      knowledgeIndexRepository,
      ingestionPort,
      executionLogPort,
    );
    const service = new ExpandKnowledgeUseCase(
      new StubProviderConfigRepository([
        {
          id: 'provider-1',
          identityId: 'identity-1',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'plain-secret',
          defaultModel: 'gpt-4o-mini',
          isActive: true,
          isDefault: true,
          name: 'Main provider',
        },
      ]) as unknown as IAIProviderConfigRepository,
      syncRelevant,
      queryPort,
      executionLogPort,
    );

    const result = await service.execute({
      instruction: 'Expand this note with citation guidance.',
      currentContent: '# Repository Grounding',
    } satisfies ExpandKnowledgeReq, { identityId: 'identity-1' });

    expect(queryPort.expand).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: expect.any(String),
        instruction: 'Expand this note with citation guidance.',
        currentContent: '# Repository Grounding',
        providerConfig: expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      }),
    );
    expect(ingestionPort.indexResource).toHaveBeenCalledWith(
      expect.objectContaining({
        providerConfig: expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.expandedContent).toContain('Grounded answers');
    expect(result.data.citations[0]?.resourcePath).toBe('notes/python-ai.md');
    expect(result.data.providerId).toBe('provider-1');
    expect(result.data.matchedResourceCount).toBe(1);
  });

  it('reindexes knowledge with the active provider config so batch rebuilds can use provider embeddings', async () => {
    const sourcePort = new StubKnowledgeSourcePort();
    const knowledgeIndexRepository = new StubKnowledgeIndexRepository();
    const ingestionPort = new StubKnowledgeIngestionPort();
    const executionLogPort = new StubExecutionLogPort();
    const reindexAll = new ReindexAllKnowledgeUseCase(
      sourcePort,
      knowledgeIndexRepository,
      ingestionPort,
      executionLogPort,
    );
    const service = new ReindexKnowledgeUseCase(
      new StubProviderConfigRepository([
        {
          id: 'provider-1',
          identityId: 'identity-1',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'plain-secret',
          defaultModel: 'gpt-4o-mini',
          isActive: true,
          isDefault: true,
          name: 'Main provider',
        },
      ]) as unknown as IAIProviderConfigRepository,
      reindexAll,
    );

    await service.execute({
      force: true,
      limit: 20,
    }, { identityId: 'identity-1' });

    expect(ingestionPort.indexResource).toHaveBeenCalledWith(
      expect.objectContaining({
        providerConfig: expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      }),
    );
  });
});

describe('AIAnalyticsQueryService', () => {
  it('builds controlled analytics context and delegates the answer generation', async () => {
    const readPort = new StubAnalyticsReadPort();
    const queryPort = new StubAnalyticsQueryPort();
    const executionLogPort = new StubExecutionLogPort();
    const service = new QueryAIAnalyticsUseCase(
      new StubProviderConfigRepository([
        {
          id: 'provider-1',
          identityId: 'identity-1',
          providerType: AIProviderType.OpenAICompatible,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: 'plain-secret',
          defaultModel: 'gpt-4o-mini',
          isActive: true,
          isDefault: true,
          name: 'Main provider',
        },
      ]) as unknown as IAIProviderConfigRepository,
      readPort,
      queryPort,
      executionLogPort,
    );

    const result = await service.queryAnalytics({
      query: 'What needs attention today?',
    } satisfies QueryAnalyticsReq, { identityId: 'identity-1' });

    expect(readPort.buildContext).toHaveBeenCalledWith(
      'identity-1',
      'What needs attention today?',
    );
    expect(queryPort.query).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: expect.any(String),
        providerConfig: expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      }),
    );
    expect(executionLogPort.record).toHaveBeenCalledTimes(1);
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'ANALYTICS_QUERY',
        status: 'COMPLETED',
        providerId: 'provider-1',
        providerName: 'Main provider',
        model: 'gpt-4o-mini',
        requestId: expect.any(String),
        costEstimate: expect.objectContaining({
          pricingModel: 'gpt-4o-mini',
          totalCostUsd: expect.any(Number),
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.highlights).toEqual(['activeGoals: 4', 'task.overdue: 2']);
    expect(result.data.providerId).toBe('provider-1');
    expect(result.data.tokenUsage.totalTokens).toBe(26);
  });
});

describe('AI knowledge auto-index runtime', () => {
  it('exposes knowledge index diagnostics through AI capabilities', async () => {
    const knowledgeIndexRepository = new StubKnowledgeIndexRepository();
    knowledgeIndexRepository.getDiagnostics.mockResolvedValueOnce({
      persistenceBackend: 'prisma-index-table',
      persistenceStatus: 'enabled',
      vectorRecallBackend: 'pgvector-ivfflat',
      vectorRecallStatus: 'enabled',
    });

    const aiModule = createAIModuleForTests({
      knowledgeSourcePort: new StubKnowledgeSourcePort(),
      knowledgeIndexRepository,
      knowledgeIngestionPort: new StubKnowledgeIngestionPort(),
      knowledgeQueryPort: new StubKnowledgeQueryPort(),
    });

    const capabilities = await aiModule.api.getCapabilities();
    expect(capabilities.ok).toBe(true);
    if (!capabilities.ok) throw new Error('expected ok');
    expect(capabilities.data).toEqual(
      expect.objectContaining({
        supportsKnowledgeQuery: true,
        knowledgeIndexDiagnostics: {
          persistenceBackend: 'prisma-index-table',
          persistenceStatus: 'enabled',
          vectorRecallBackend: 'pgvector-ivfflat',
          vectorRecallStatus: 'enabled',
        },
      }),
    );
  });

  it('reindexes a changed repository resource after a repository mutation event', async () => {
    const sourcePort = new StubKnowledgeSourcePort();
    const knowledgeIndexRepository = new StubKnowledgeIndexRepository();
    const ingestionPort = new StubKnowledgeIngestionPort();
    const queryPort = new StubKnowledgeQueryPort();

    const aiModule = createAIModuleForTests({
      providerConfigRepository: createAIProviderConfigRepositoryStub({
        findDefaultByIdentityId: async () =>
          createAIProviderConfigServerDTO({
            providerType: AIProviderType.OpenAICompatible,
          }),
      }),
      knowledgeSourcePort: sourcePort,
      knowledgeIndexRepository,
      knowledgeIngestionPort: ingestionPort,
      knowledgeQueryPort: queryPort,
    });

    aiModule.start();

    try {
      (eventBus as any).send(REPOSITORY_RESOURCE_MUTATED_EVENT, {
        identityId: 'identity-1',
        repositoryId: 'repo-1',
        resourceId: 'resource-1',
        resourcePath: 'notes/python-ai.md',
        mutation: RepositoryResourceMutationType.ContentUpdated,
        timestamp: Date.now(),
      });

      await vi.waitFor(() => {
        expect(sourcePort.getResourceById).toHaveBeenCalledWith('identity-1', 'resource-1');
        expect(ingestionPort.indexResource).toHaveBeenCalledTimes(1);
        expect(ingestionPort.indexResource).toHaveBeenCalledWith(
          expect.objectContaining({
            providerConfig: expect.objectContaining({
              model: 'gpt-4o-mini',
            }),
          }),
        );
        expect(knowledgeIndexRepository.upsert).toHaveBeenCalledTimes(1);
      });
    } finally {
      aiModule.dispose();
    }
  });
});
