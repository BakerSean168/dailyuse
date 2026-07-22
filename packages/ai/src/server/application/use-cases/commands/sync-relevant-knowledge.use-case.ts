import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  IAIExecutionLogPort,
  IKnowledgeIndexRepository,
  IKnowledgeIngestionPort,
  IKnowledgeIndexStatusPort,
  IKnowledgeSourcePort,
  KnowledgeSourceNote,
} from '../../ports';
import { SyncKnowledgeNotesUseCase } from './sync-knowledge-notes.use-case';
import {
  mergeUniqueNotes,
  type SyncKnowledgeNotesOptions,
  type SyncKnowledgeNotesResult,
} from './ai-knowledge-index-helpers';

/**
 * 同步相关知识资源
 */
export class SyncRelevantKnowledgeUseCase {
  private readonly syncResources: SyncKnowledgeNotesUseCase;

  constructor(
    private readonly knowledgeSourcePort: IKnowledgeSourcePort,
    private readonly knowledgeIndexRepository: IKnowledgeIndexRepository,
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
    query: string,
    limit: number,
    cx: ExecutionContext,
    options?: SyncKnowledgeNotesOptions,
  ): Promise<{
    resources: KnowledgeSourceNote[];
    sync: SyncKnowledgeNotesResult;
  }> {
    const requestedLimit = Math.max(limit, 1);
    const candidateLimit = Math.min(Math.max(requestedLimit * 4, 24), 80);
    const indexedCandidates = await this.knowledgeIndexRepository.findRelevantNotes(
      cx.identityId,
      query,
      candidateLimit,
    );
    const hydratedIndexedCandidates = mergeUniqueNotes(
      (
        await Promise.all(
          indexedCandidates.map(async (resource) =>
            this.knowledgeSourcePort.getNoteById(cx.identityId, resource.resourceId),
          ),
        )
      ).filter((resource): resource is KnowledgeSourceNote => resource !== null),
    );
    const relevantResources =
      hydratedIndexedCandidates.length >= Math.min(requestedLimit, 6)
        ? []
        : await this.knowledgeSourcePort.listRelevantNotes(
            cx.identityId,
            query,
            candidateLimit,
          );
    const fallbackResources =
      hydratedIndexedCandidates.length + relevantResources.length >= Math.min(requestedLimit, 6)
        ? []
        : await this.knowledgeSourcePort.listIndexableNotes(cx.identityId, candidateLimit);
    const resources = mergeUniqueNotes([
      ...hydratedIndexedCandidates,
      ...relevantResources,
      ...fallbackResources,
    ]).slice(0, candidateLimit);
    const sync = await this.syncResources.execute(resources, cx, options);
    return {
      resources,
      sync,
    };
  }
}
