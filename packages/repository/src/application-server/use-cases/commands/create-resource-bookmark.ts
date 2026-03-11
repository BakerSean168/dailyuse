import type { ResourceBookmarkClientDTO } from '@dailyuse/contracts/repository';
import {
  type IResourceBookmarkRepository,
  toBookmarkClientDTO,
} from '../../../domain-server/repositories/IResourceBookmarkRepository';
import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';

export class CreateResourceBookmark {
  constructor(
    private readonly bookmarkRepository: IResourceBookmarkRepository,
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(input: {
    repositoryId: string;
    identityId: string;
    resourceId: string;
    aliasName?: string | null;
    icon?: string | null;
    color?: string | null;
  }): Promise<{ bookmark: ResourceBookmarkClientDTO }> {
    const bookmark = await this.bookmarkRepository.create(input);
    const resource = await this.resourceRepository.findById(input.resourceId);
    if (!resource) {
      throw new Error(`Resource not found: ${input.resourceId}`);
    }
    return { bookmark: toBookmarkClientDTO(bookmark, bookmark.aliasName ?? resource.name) };
  }
}
