/**
 * List Resources
 *
 * 鑾峰彇浠撳偍鐨勬墍鏈夎祫婧?
 */

import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

/**
 * List Resources Input
 */
export interface ListResourcesInput {
  repositoryUuid: string;
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
    const resources = await this.resourceRepository.findByRepositoryUuid(input.repositoryUuid);
    return { resources: resources.map((r) => r.toClientDTO()) };
  }
}


