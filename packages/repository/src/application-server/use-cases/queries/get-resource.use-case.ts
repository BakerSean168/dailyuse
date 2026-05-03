/**
 * Get Resource
 *
 * Get resource detail
 */

import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * Get Resource Input
 */
export interface GetResourceInput {
  id: string;
}

/**
 * Get Resource Output
 */
export interface GetResourceOutput {
  resource: ResourceClientDTO | null;
}

/**
 * Get Resource Use Case
 */
export class GetResourceUseCase {

  constructor(private readonly resourceRepository: IResourceRepository) {}

  async execute(input: GetResourceInput): Promise<Result<GetResourceOutput>> {
    const resource = await this.resourceRepository.findById(input.id);
    return ok({ resource: resource ? resource.toClientDTO() : null });
  }
}
