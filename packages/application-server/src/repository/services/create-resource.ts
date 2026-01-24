/**
 * Create Resource
 *
 * Create resource
 */

import { v4 as uuidv4 } from 'uuid';
import { Resource } from '@dailyuse/domain-server/repository';
import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { ResourceType } from '@dailyuse/contracts/repository';

/**
 * Create Resource Input
 */
export interface CreateResourceInput {
  repositoryUuid: string;
  folderUuid?: string;
  name: string;
  type: ResourceType;
  path: string;
  content?: string;
}

/**
 * Create Resource Output
 */
export interface CreateResourceOutput {
  resource: ResourceClientDTO;
}

/**
 * Create Resource
 */
export class CreateResource {

  constructor(private readonly resourceRepository: IResourceRepository) {}

  async execute(input: CreateResourceInput): Promise<CreateResourceOutput> {
    const exists = await this.resourceRepository.existsByPath(input.repositoryUuid, input.path);
    if (exists) {
      throw new Error(`Resource already exists at path: ${input.path}`);
    }

    const resource = Resource.create({
      uuid: uuidv4(),
      repositoryUuid: input.repositoryUuid,
      folderUuid: input.folderUuid,
      name: input.name,
      type: input.type,
      path: input.path,
      content: input.content,
    });

    if (input.content) {
      resource.activate();
    }

    await this.resourceRepository.save(resource);
    return { resource: resource.toClientDTO() };
  }
}

