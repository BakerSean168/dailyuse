/**
 * List Resources
 *
 * List all resources in a repository
 */

import type { IResourceRepository } from '../../../domain/repositories/i-resource-repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * List Resources Input
 */
export interface ListResourcesInput {
  repositoryId: string;
}

/**
 * List Resources Output
 */
export interface ListResourcesOutput {
  resources: ResourceClientDTO[];
}

/**
 * List Resources Use Case
 */
export class ListResourcesUseCase {

  constructor(private readonly resourceRepository: IResourceRepository) {}

  async execute(input: ListResourcesInput): Promise<Result<ListResourcesOutput>> {
    const resources = await this.resourceRepository.findByRepositoryId(input.repositoryId);
    return ok({ resources: resources.map((r) => r.toClientDTO()) });
  }
}
