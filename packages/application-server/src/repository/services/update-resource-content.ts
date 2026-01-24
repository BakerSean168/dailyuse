/**
 * Update Resource Content
 *
 * 鏇存柊 Markdown 鍐呭
 */

import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

/**
 * Update Resource Content Input
 */
export interface UpdateResourceContentInput {
  uuid: string;
  content: string;
}

/**
 * Update Resource Content Output
 */
export interface UpdateResourceContentOutput {
  resource: ResourceClientDTO;
}

/**
 * Update Resource Content
 */
export class UpdateResourceContent {

  constructor(private readonly resourceRepository: IResourceRepository) {}

  async execute(input: UpdateResourceContentInput): Promise<UpdateResourceContentOutput> {
    const resource = await this.resourceRepository.findById(input.uuid);
    if (!resource) {
      throw new Error(`Resource not found: ${input.uuid}`);
    }

    resource.updateMarkdownContent(input.content);
    await this.resourceRepository.save(resource);
    return { resource: resource.toClientDTO() };
  }
}

