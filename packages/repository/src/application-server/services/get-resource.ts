/**
 * Get Resource
 *
 * GetResource璇︽儏
 */

import type { IResourceRepository } from '../../domain-server/repositories/IResourceRepository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

/**
 * Get Resource Input
 */
export interface GetResourceInput {
  uuid: string;
}

/**
 * Get Resource Output
 */
export interface GetResourceOutput {
  resource: ResourceClientDTO | null;
}

/**
 * Get Resource
 */
export class GetResource {

  constructor(private readonly resourceRepository: IResourceRepository) {}

  async execute(input: GetResourceInput): Promise<GetResourceOutput> {
    const resource = await this.resourceRepository.findById(input.uuid);
    return { resource: resource ? resource.toClientDTO() : null };
  }
}


