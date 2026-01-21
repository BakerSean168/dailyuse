/**
 * List Repositories
 *
 * 获取用户的所有仓储
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import { Repository } from '@dailyuse/domain-server/repository';
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
