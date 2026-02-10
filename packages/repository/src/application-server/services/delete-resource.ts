/**
 * Delete Resource
 *
 * Delete asset
 */

import type { IResourceRepository } from '@/domain-server';

/**
 * Delete Resource Input
 */
export interface DeleteResourceInput {
  uuid: string;
}

/**
 * Delete Resource
 */
export class DeleteResource {

  constructor(private readonly resourceRepository: IResourceRepository) {}

  async execute(input: DeleteResourceInput): Promise<void> {
    const resource = await this.resourceRepository.findById(input.uuid);
    if (!resource) {
      throw new Error(`Resource not found: ${input.uuid}`);
    }

    resource.delete();
    await this.resourceRepository.save(resource);
  }
}

