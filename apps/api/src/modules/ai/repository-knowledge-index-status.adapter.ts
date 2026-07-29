import type { IKnowledgeIndexStatusPort, KnowledgeIndexStatusUpdate } from '@memoflow/ai/ports';
import type { RepositoryApplicationPort } from '@memoflow/repository';

/** Bridges AI indexing outcomes back to the repository-owned projection. */
export class RepositoryKnowledgeIndexStatusAdapter implements IKnowledgeIndexStatusPort {
  constructor(private readonly repositoryApi: RepositoryApplicationPort) {}

  async updateIndexStatus(identityId: string, update: KnowledgeIndexStatusUpdate): Promise<void> {
    const result = await this.repositoryApi.updateKnowledgeNoteProjectionIndexStatus(
      { identityId },
      {
        projectionId: update.resourceId,
        contentHash: update.contentHash,
        status: update.status,
      },
    );
    if (!result.ok) {
      throw new Error(result.error.message);
    }
  }
}
