/**
 * Create Repository
 *
 * Create repository
 */

import type { IRepositoryRepository } from '@/domain-server';
import { Repository } from '@/domain-server';
import type {
  RepositoryClientDTO,
  RepositoryConfigServerDTO,
} from '@dailyuse/contracts/repository';
import { RepositoryType } from '@dailyuse/contracts/repository';

/**
 * Create Repository Input
 */
export interface CreateRepositoryInput {
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config?: Partial<RepositoryConfigServerDTO>;
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
    const repository = Repository.create(input);
    await this.repositoryRepository.save(repository);
    return { repository: repository.toClientDTO() };
  }
}

