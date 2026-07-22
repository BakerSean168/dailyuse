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
  SyncKnowledgeResourceByIdResult,
} from './ai-knowledge-index-helpers';

/**
 * 按 ID 同步单个知识资源
 */
export class SyncResourceByIdUseCase {
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
    resourceId: string,
    cx: ExecutionContext,
    options?: SyncKnowledgeResourcesOptions,
  ): Promise<SyncKnowledgeResourceByIdResult> {
    const resource = await this.knowledgeSourcePort.getNoteById(cx.identityId, resourceId);
    if (!resource) {
      return {
        resource: null,
        sync: null,
      };
    }

    return {
      resource,
      sync: await this.syncResources.execute([resource], cx, {
        ...options,
        force: options?.force ?? true,
      }),
    };
  }
}
