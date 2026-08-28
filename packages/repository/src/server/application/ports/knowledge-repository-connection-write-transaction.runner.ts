import type { IKnowledgeRepositoryConnectionRepository } from './knowledge-repository-connection.repository';
import type { IKnowledgeRepositoryInstallationIntentRepository } from './knowledge-repository-installation-intent.repository';

export interface KnowledgeRepositoryConnectionWriteRepositories {
  connectionRepository: IKnowledgeRepositoryConnectionRepository;
  installationIntentRepository: IKnowledgeRepositoryInstallationIntentRepository;
}

/**
 * Owns the atomic boundary for the final knowledge-repository connection grant.
 * The connection record and installation-intent consumption must commit or roll
 * back together so a caller never observes "connected but reusable intent".
 */
export interface IKnowledgeRepositoryConnectionWriteTransactionRunner {
  run<T>(
    work: (repositories: KnowledgeRepositoryConnectionWriteRepositories) => Promise<T>,
  ): Promise<T>;
}
