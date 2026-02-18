/**
 * List Resources
 *
 * GetRepository鐨勬墍鏈夎祫婧?
 */

import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

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
 * List Resources
 */
export class ListResources {

  constructor(private readonly resourceRepository: IResourceRepository) {}

  async execute(input: ListResourcesInput): Promise<ListResourcesOutput> {
    const resources = await this.resourceRepository.findByRepositoryId(input.repositoryId);
    return { resources: resources.map((r) => r.toClientDTO()) };
  }
}


