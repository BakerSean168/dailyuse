import type {
  KnowledgeRepositoryConnectionServerDTO,
  KnowledgeRepositoryConnectionStatus,
} from '@dailyuse/contracts/repository';

export interface IKnowledgeRepositoryConnectionRepository {
  findById(id: string): Promise<KnowledgeRepositoryConnectionServerDTO | null>;
  findByIdForIdentity(
    identityId: string,
    id: string,
  ): Promise<KnowledgeRepositoryConnectionServerDTO | null>;
  findByIdentityId(identityId: string): Promise<KnowledgeRepositoryConnectionServerDTO[]>;
  findByGithubRepositoryId(
    githubRepositoryId: string,
  ): Promise<KnowledgeRepositoryConnectionServerDTO | null>;
  findByInstallationAndGithubRepositoryId(
    installationId: string,
    githubRepositoryId: string,
  ): Promise<KnowledgeRepositoryConnectionServerDTO | null>;
  listProjectionCandidates(
    limit: number,
    cursor?: { updatedAt: number; id: string },
  ): Promise<KnowledgeRepositoryConnectionServerDTO[]>;
  save(connection: KnowledgeRepositoryConnectionServerDTO): Promise<void>;
  updateStatus(
    identityId: string,
    id: string,
    status: KnowledgeRepositoryConnectionStatus,
    error?: { code: string; message: string } | null,
  ): Promise<void>;
}
