import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

export interface CreateKnowledgeNotePersistenceInput {
  identityId: string;
  fileName: string;
  path: string;
  content: string;
}

export interface CreateKnowledgeNotePersistenceResult {
  resource: ResourceClientDTO;
}

export interface IKnowledgeNotePersistencePort {
  createKnowledgeNote(
    input: CreateKnowledgeNotePersistenceInput,
  ): Promise<CreateKnowledgeNotePersistenceResult>;
}
