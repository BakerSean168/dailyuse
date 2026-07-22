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
  SyncKnowledgeNoteByIdResult,
} from './ai-knowledge-index-helpers';

/**
 * 按 ID 同步单个知识笔记
 */
export class SyncNoteByIdUseCase {
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
    resourceId: string,
    cx: ExecutionContext,
    options?: SyncKnowledgeNotesOptions,
  ): Promise<SyncKnowledgeNoteByIdResult> {
    const resource = await this.knowledgeSourcePort.getNoteById(cx.identityId, resourceId);
    if (!resource) {
      return {
        note: null,
        sync: null,
      };
    }

    return {
      note: resource,
      sync: await this.syncResources.execute([resource], cx, {
        ...options,
        force: options?.force ?? true,
      }),
    };
  }
}
