import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  IAIExecutionLogPort,
  IKnowledgeIndexRepository,
  IKnowledgeIngestionPort,
  IKnowledgeIndexStatusPort,
  IKnowledgeSourcePort,
} from '../../ports';
import { SyncKnowledgeNotesUseCase } from './sync-knowledge-notes.use-case';
import type {
  SyncKnowledgeNotesOptions,
  SyncKnowledgeNotesResult,
} from './ai-knowledge-index-helpers';

/**
 * 重建全部知识索引
 */
export class ReindexAllKnowledgeUseCase {
  private readonly syncResources: SyncKnowledgeNotesUseCase;

  constructor(
    private readonly knowledgeSourcePort: IKnowledgeSourcePort,
    knowledgeIndexRepository: IKnowledgeIndexRepository,
    knowledgeIngestionPort: IKnowledgeIngestionPort,
    executionLogPort?: IAIExecutionLogPort,
    knowledgeIndexStatusPort?: IKnowledgeIndexStatusPort,
  ) {
    this.syncResources = new SyncKnowledgeNotesUseCase(
      knowledgeIndexRepository,
      knowledgeIngestionPort,
      executionLogPort,
      knowledgeIndexStatusPort,
    );
  }

  async execute(
    cx: ExecutionContext,
    limit = 200,
    options?: SyncKnowledgeNotesOptions,
  ): Promise<SyncKnowledgeNotesResult> {
    const resources = await this.knowledgeSourcePort.listIndexableNotes(cx.identityId, limit);
    return this.syncResources.execute(resources, cx, {
      ...options,
      force: options?.force ?? true,
    });
  }
}
