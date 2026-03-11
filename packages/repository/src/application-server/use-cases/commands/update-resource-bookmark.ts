import type { ResourceBookmarkClientDTO } from '@dailyuse/contracts/repository';
import {
  type IResourceBookmarkRepository,
  toBookmarkClientDTO,
} from '../../../domain-server/repositories/IResourceBookmarkRepository';
import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';

export class UpdateResourceBookmark {
  constructor(
    private readonly bookmarkRepository: IResourceBookmarkRepository,
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(input: {
    repositoryId: string;
    identityId: string;
    bookmarkId: string;
    aliasName?: string | null;
    icon?: string | null;
    color?: string | null;
  }): Promise<{ bookmark: ResourceBookmarkClientDTO }> {
    const bookmark = await this.bookmarkRepository.update(input);
    const resource = await this.resourceRepository.findById(bookmark.resourceId);
    if (!resource) {
      throw new Error(`Resource not found: ${bookmark.resourceId}`);
    }
    return { bookmark: toBookmarkClientDTO(bookmark, bookmark.aliasName ?? resource.name) };
  }
}
