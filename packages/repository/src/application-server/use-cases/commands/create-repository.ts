/**
 * Create Repository
 *
 * Create repository
 */

import type { IRepositoryRepository } from '../../../domain-server/repositories/IRepositoryRepository';
import { Repository } from '../../../domain-server/aggregates/repository';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import type { RepositoryClientDTO, RepositoryConfigDTO } from '@dailyuse/contracts/repository';
import { RepositoryStatus, RepositoryType } from '@dailyuse/contracts/repository';

/**
 * Create Repository Input
 */
export interface CreateRepositoryInput {
  identityId: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config?: Partial<RepositoryConfigDTO>;
}

/**
 * Create Repository Output
 */
export interface CreateRepositoryOutput {
  repository: RepositoryClientDTO;
}

/**
 * Create Repository
 */
export class CreateRepository {
  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: CreateRepositoryInput): Promise<CreateRepositoryOutput> {
    const existingRepositories = await this.repositoryRepository.findByIdentityId(input.identityId);
    const existingRepository = pickCanonicalRepository(existingRepositories);

    if (existingRepository) {
      return { repository: existingRepository.toClientDTO() };
    }

    const repository = Repository.create({
      identityId: IdentityId.of(input.identityId),
      name: input.name,
      type: input.type,
      path: input.path,
      description: input.description ?? null,
      config: input.config,
    });
    await this.repositoryRepository.save(repository);
    return { repository: repository.toClientDTO() };
  }
}

function pickCanonicalRepository(repositories: Repository[]): Repository | null {
  if (repositories.length === 0) {
    return null;
  }

  const activeRepository = repositories.find(
    (repository) => repository.status === RepositoryStatus.Active,
  );

  return activeRepository ?? repositories[0] ?? null;
}
