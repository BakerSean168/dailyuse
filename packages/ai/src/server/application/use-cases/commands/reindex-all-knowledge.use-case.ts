import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  IAIExecutionLogPort,
  IKnowledgeIndexRepository,
  IKnowledgeIngestionPort,
  IKnowledgeIndexStatusPort,
  IKnowledgeSourcePort,
} from '../../ports';
import { SyncKnowledgeResourcesUseCase } from './sync-knowledge-resources.use-case';
import type {
  SyncKnowledgeResourcesOptions,
  SyncKnowledgeResourcesResult,
} from './ai-knowledge-index-helpers';

/**
 * 重建全部知识索引
 */
export class ReindexAllKnowledgeUseCase {
  private readonly syncResources: SyncKnowledgeResourcesUseCase;

  constructor(
    private readonly knowledgeSourcePort: IKnowledgeSourcePort,
    knowledgeIndexRepository: IKnowledgeIndexRepository,
    knowledgeIngestionPort: IKnowledgeIngestionPort,
    executionLogPort?: IAIExecutionLogPort,
    knowledgeIndexStatusPort?: IKnowledgeIndexStatusPort,
  ) {
    this.syncResources = new SyncKnowledgeResourcesUseCase(
      knowledgeIndexRepository,
      knowledgeIngestionPort,
      executionLogPort,
      knowledgeIndexStatusPort,
    );
  }

  async execute(
    cx: ExecutionContext,
    limit = 200,
    options?: SyncKnowledgeResourcesOptions,
  ): Promise<SyncKnowledgeResourcesResult> {
    const resources = await this.knowledgeSourcePort.listIndexableResources(cx.identityId, limit);
    return this.syncResources.execute(resources, cx, {
      ...options,
      force: options?.force ?? true,
    });
  }
}
