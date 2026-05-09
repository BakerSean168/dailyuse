import type { IResourceBookmarkRepository } from '../../../domain-server/repositories/IResourceBookmarkRepository';
import type { BookmarkId } from '@dailyuse/contracts/primitives';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class DeleteResourceBookmarkUseCase {
  constructor(private readonly bookmarkRepository: IResourceBookmarkRepository) {}

  async execute(input: {
    repositoryId: string;
    identityId: string;
    bookmarkId: BookmarkId;
  }): Promise<Result<void>> {
    await this.bookmarkRepository.delete(input);
    return ok(undefined);
  }
}
