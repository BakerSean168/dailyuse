import type { ResourceBookmarkClientDTO } from '@dailyuse/contracts/repository';
import {
  type IResourceBookmarkRepository,
  toBookmarkClientDTO,
} from '../../../domain/repositories/i-resource-bookmark-repository';
import type { IResourceRepository } from '../../../domain/repositories/i-resource-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

export class CreateResourceBookmarkUseCase {
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
  }): Promise<Result<{ bookmark: ResourceBookmarkClientDTO }>> {
    const bookmark = await this.bookmarkRepository.create(input);
    const resource = await this.resourceRepository.findById(input.resourceId);
    if (!resource) {
      return error('NOT_FOUND', `Resource not found: ${input.resourceId}`);
    }
    return ok({ bookmark: toBookmarkClientDTO(bookmark, bookmark.aliasName ?? resource.name) });
  }
}
