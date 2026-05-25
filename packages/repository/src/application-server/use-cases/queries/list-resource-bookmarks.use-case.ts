import type { ResourceBookmarkClientDTO } from '@dailyuse/contracts/repository';
import {
  type IResourceBookmarkRepository,
  toBookmarkClientDTO,
} from '../../../domain-server/repositories/i-resource-bookmark-repository';
import type { IResourceRepository } from '../../../domain-server/repositories/i-resource-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ListResourceBookmarksUseCase {
  constructor(
    private readonly bookmarkRepository: IResourceBookmarkRepository,
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(input: {
    repositoryId: string;
    identityId: string;
  }): Promise<Result<{ bookmarks: ResourceBookmarkClientDTO[] }>> {
    const bookmarks = await this.bookmarkRepository.list(input.repositoryId, input.identityId);
    const resources = await this.resourceRepository.findByRepositoryId(input.repositoryId);
    const resourceById = new Map(resources.map((resource) => [String(resource.id), resource]));

    return ok({
      bookmarks: bookmarks
        .map((bookmark) => {
          const resource = resourceById.get(bookmark.resourceId);
          if (!resource) return null;
          return toBookmarkClientDTO(bookmark, bookmark.aliasName ?? resource.name);
        })
        .filter(Boolean) as ResourceBookmarkClientDTO[],
    });
  }
}
