import type { ResourceBookmarkClientDTO } from '@dailyuse/contracts/repository';
import type { BookmarkId } from '@dailyuse/contracts/primitives';
import {
  type IResourceBookmarkRepository,
  toBookmarkClientDTO,
} from '../../../domain-server/repositories/IResourceBookmarkRepository';
import type { IResourceRepository } from '../../../domain-server/repositories/IResourceRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class ReorderResourceBookmarksUseCase {
  constructor(
    private readonly bookmarkRepository: IResourceBookmarkRepository,
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(input: {
    repositoryId: string;
    identityId: string;
    bookmarkIds: BookmarkId[];
  }): Promise<Result<{ bookmarks: ResourceBookmarkClientDTO[] }>> {
    const bookmarks = await this.bookmarkRepository.reorder(input);
    const resources = await this.resourceRepository.findByRepositoryId(input.repositoryId);
    const resourceById = new Map(resources.map((resource) => [String(resource.id), resource]));

    return ok({
      bookmarks: bookmarks.map((bookmark) => {
        const resource = resourceById.get(bookmark.resourceId);
        return toBookmarkClientDTO(bookmark, bookmark.aliasName ?? resource?.name ?? 'Unknown');
      }),
    });
  }
}
