/**
 * List Repositories
 *
 * Get all repositories of the user?
 */

import type { IRepositoryRepository } from '@/domain-server';
import { Repository } from '@/domain-server';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryStatus } from '@dailyuse/contracts/repository';

/**
 * List Repositories Input
 */
export interface ListRepositoriesInput {
  accountUuid: string;
  status?: RepositoryStatus;
}

/**
 * List Repositories Output
 */
export interface ListRepositoriesOutput {
  repositories: RepositoryClientDTO[];
}

/**
 * List Repositories
 */
export class ListRepositories {

  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: ListRepositoriesInput): Promise<ListRepositoriesOutput> {
    let repositories: Repository[];

    if (input.status) {
      repositories = await this.repositoryRepository.findByAccountUuidAndStatus(
        input.accountUuid,
        input.status,
      );
    } else {
      repositories = await this.repositoryRepository.findByAccountUuid(input.accountUuid);
    }

    return { repositories: repositories.map((r) => r.toClientDTO()) };
  }
}

