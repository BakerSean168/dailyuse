import type { ResourceBookmarkClientDTO } from '@dailyuse/contracts/repository';
import type { BookmarkId } from '@dailyuse/contracts/primitives';
import {
  type IResourceBookmarkRepository,
  toBookmarkClientDTO,
} from '../../../domain-server/repositories/i-resource-bookmark-repository';
import type { IResourceRepository } from '../../../domain-server/repositories/i-resource-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class UpdateResourceBookmarkUseCase {
  constructor(
    private readonly bookmarkRepository: IResourceBookmarkRepository,
    private readonly resourceRepository: IResourceRepository,
  ) {}

  async execute(input: {
    repositoryId: string;
    identityId: string;
    bookmarkId: BookmarkId;
    aliasName?: string | null;
    icon?: string | null;
    color?: string | null;
  }): Promise<Result<{ bookmark: ResourceBookmarkClientDTO }>> {
    const bookmark = await this.bookmarkRepository.update(input);
    const resource = await this.resourceRepository.findById(bookmark.resourceId);
    if (!resource) {
      return error('NOT_FOUND', `Resource not found: ${bookmark.resourceId}`);
    }
    return ok({ bookmark: toBookmarkClientDTO(bookmark, bookmark.aliasName ?? resource.name) });
  }
}
