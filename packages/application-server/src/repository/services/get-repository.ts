/**
 * Get Repository
 *
 * 鑾峰彇浠撳偍璇︽儏
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';

/**
 * Get Repository Input
 */
export interface GetRepositoryInput {
  uuid: string;
}

/**
 * Get Repository Output
 */
export interface GetRepositoryOutput {
  repository: RepositoryClientDTO | null;
}

/**
 * Get Repository
 */
export class GetRepository {

  constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  async execute(input: GetRepositoryInput): Promise<GetRepositoryOutput> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    return { repository: repository ? repository.toClientDTO() : null };
  }
}

