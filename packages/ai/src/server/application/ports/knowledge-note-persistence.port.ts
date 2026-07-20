import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

export interface CreateKnowledgeNotePersistenceInput {
  identityId: string;
  /** Explicit GitHub knowledge-repository connection for multi-repository users. */
  connectionId?: string;
  fileName: string;
  path: string;
  content: string;
  proposalId?: string;
  proposalRevision?: number;
  requestId?: string;
}

export interface CreateKnowledgeNotePersistenceResult {
  resource: ResourceClientDTO;
}

export interface IKnowledgeNotePersistencePort {
  createKnowledgeNote(
    input: CreateKnowledgeNotePersistenceInput,
  ): Promise<CreateKnowledgeNotePersistenceResult>;
}
