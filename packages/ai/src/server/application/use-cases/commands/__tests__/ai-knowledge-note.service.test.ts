import { describe, expect, it, vi } from 'vitest';

import { AIProviderType } from '@dailyuse/contracts/ai';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

import type {
  AIExecutionLogInput,
  CreateKnowledgeNotePersistenceInput,
  CreateKnowledgeNotePersistenceResult,
  IAIExecutionLogPort,
  IKnowledgeNoteGenerationPort,
  IKnowledgeNotePersistencePort,
  KnowledgeNoteGenerationInput,
  KnowledgeNoteGenerationResult,
} from '../../../ports';
import { AIKnowledgeNotePathResolver } from '../../../services/ai-knowledge-note-path-resolver';
import type { IAIProviderConfigRepository } from '../../../../domain/repositories/i-ai-provider-config-repository';
import { ManageAIKnowledgeNoteUseCase } from '../manage-ai-knowledge-note.use-case';

class StubProviderConfigRepository {
  constructor(
    private readonly provider: {
      id: string;
      identityId: string;
      providerType: string;
      baseUrl: string;
      apiKey: string;
      defaultModel: string | null;
      isActive: boolean;
      isDefault?: boolean;
      name?: string;
    },
  ) {}

  async findById(id: string) {
    return id === this.provider.id ? this.provider : null;
  }

  async findDefaultByIdentityId() {
    return null;
  }

  async findByIdentityId() {
    return [this.provider];
  }
}

class StubKnowledgeNoteGenerationPort implements IKnowledgeNoteGenerationPort {
  public readonly generate = vi.fn<
    (input: KnowledgeNoteGenerationInput) => Promise<KnowledgeNoteGenerationResult>
  >(async () => ({
    content: '# Python Tooling\n\nA concise note.',
    usage: {
      promptTokens: 20,
      completionTokens: 10,
      totalTokens: 30,
    },
  }));
}

class StubKnowledgeNotePersistencePort implements IKnowledgeNotePersistencePort {
  public readonly createKnowledgeNote = vi.fn<
    (input: CreateKnowledgeNotePersistenceInput) => Promise<CreateKnowledgeNotePersistenceResult>
  >(async (input) => ({
    resource: createResource(input),
  }));
}

class StubExecutionLogPort implements IAIExecutionLogPort {
  public readonly record = vi.fn<(input: AIExecutionLogInput) => Promise<void>>(async () => {});
}

function createResource(input: CreateKnowledgeNotePersistenceInput): ResourceClientDTO {
  return {
    id: 'resource-1' as ResourceClientDTO['id'],
    repositoryId: 'repository-1' as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: input.fileName,
    type: 'note' as ResourceClientDTO['type'],
    mimeType: 'text/markdown',
    path: input.path,
    size: input.content.length,
    content: input.content,
    metadata: {} as ResourceClientDTO['metadata'],
    stats: {} as ResourceClientDTO['stats'],
    status: 'active' as ResourceClientDTO['status'],
    createdAt: Date.now() as ResourceClientDTO['createdAt'],
    updatedAt: Date.now() as ResourceClientDTO['updatedAt'],
    deletedAt: null,
    version: 1,
    isDeleted: false,
    isArchived: false,
    isActive: true,
    isDraft: false,
    statusText: 'active',
    typeText: 'note',
    displayName: input.fileName,
    formattedSize: '1 KB',
    createdAtText: 'now',
    updatedAtText: 'now',
    extension: '.md',
    icon: 'description',
  };
}

describe('AIKnowledgeNoteService', () => {
  function createService(dependencies: {
    executionPort: StubKnowledgeNoteGenerationPort;
    persistencePort: StubKnowledgeNotePersistencePort;
    executionLogPort: StubExecutionLogPort;
  }) {
    return new ManageAIKnowledgeNoteUseCase(
      new StubProviderConfigRepository({
        id: 'provider-1',
        identityId: 'identity-1',
        providerType: AIProviderType.OpenAICompatible,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'plain-secret',
        defaultModel: 'gpt-4o-mini',
        isActive: true,
        name: 'Main provider',
      }) as unknown as IAIProviderConfigRepository,
      dependencies.executionPort,
      dependencies.persistencePort,
      new AIKnowledgeNotePathResolver(),
      dependencies.executionLogPort,
    );
  }

  it('generates markdown through the execution port and persists the note', async () => {
    const executionPort = new StubKnowledgeNoteGenerationPort();
    const persistencePort = new StubKnowledgeNotePersistencePort();
    const executionLogPort = new StubExecutionLogPort();
    const service = createService({
      executionPort,
      persistencePort,
      executionLogPort,
    });

    const result = await service.createKnowledgeNote(
      {
        topic: 'Python tooling',
        title: 'Python Tooling',
        targetSubpath: 'python',
        confirmation: {
          proposalId: 'proposal-generated',
          revision: 1,
          requestId: 'request-generated',
        },
      },
      { identityId: 'identity-1' },
    );

    expect(executionPort.generate).toHaveBeenCalledWith({
      identityId: 'identity-1',
      providerConfig: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: 'plain-secret',
        baseUrl: 'https://api.openai.com/v1',
        temperature: 0.4,
        maxTokens: undefined,
      },
      topic: 'Python tooling',
      title: 'Python Tooling',
      requestId: expect.any(String),
    });

    expect(persistencePort.createKnowledgeNote).toHaveBeenCalledWith({
      identityId: 'identity-1',
      path: 'python/Python-Tooling.md',
      fileName: 'Python-Tooling.md',
      content: '# Python Tooling\n\nA concise note.',
      proposalId: 'proposal-generated',
      proposalRevision: 1,
      requestId: 'request-generated',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.providerId).toBe('provider-1');
    expect(result.data.tokenUsage.totalTokens).toBe(30);
    expect(result.data.resolvedPath).toBe('python/Python-Tooling.md');
    expect(result.data.indexStatus).toBe('pending');
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'KNOWLEDGE_NOTE_GENERATION',
        status: 'COMPLETED',
        providerId: 'provider-1',
        providerName: 'Main provider',
        model: 'gpt-4o-mini',
        requestId: expect.any(String),
      }),
    );
  });

  it('persists reviewed markdown directly without regenerating the note', async () => {
    const executionPort = new StubKnowledgeNoteGenerationPort();
    const persistencePort = new StubKnowledgeNotePersistencePort();
    const executionLogPort = new StubExecutionLogPort();
    const service = createService({
      executionPort,
      persistencePort,
      executionLogPort,
    });

    const result = await service.createKnowledgeNote(
      {
        topic: 'Agent note draft',
        title: 'Agent Note Draft',
        targetSubpath: 'python',
        contentMarkdown: '# Agent Note Draft\n\nReviewed markdown from the Agent runtime.',
        confirmation: {
          proposalId: 'proposal-reviewed',
          revision: 3,
          requestId: 'request-reviewed',
        },
      },
      { identityId: 'identity-1' },
    );

    expect(executionPort.generate).not.toHaveBeenCalled();
    expect(persistencePort.createKnowledgeNote).toHaveBeenCalledWith({
      identityId: 'identity-1',
      path: 'python/Agent-Note-Draft.md',
      fileName: 'Agent-Note-Draft.md',
      content: '# Agent Note Draft\n\nReviewed markdown from the Agent runtime.',
      proposalId: 'proposal-reviewed',
      proposalRevision: 3,
      requestId: 'request-reviewed',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected ok');
    expect(result.data.tokenUsage).toEqual({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });
    expect(result.data.resolvedPath).toBe('python/Agent-Note-Draft.md');
    expect(result.data.indexStatus).toBe('pending');
    expect(executionLogPort.record).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'KNOWLEDGE_NOTE_GENERATION',
        status: 'COMPLETED',
        input: expect.objectContaining({
          topic: 'Agent note draft',
          contentMarkdownLength: 61,
        }),
      }),
    );
  });
});
