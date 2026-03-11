import type { IResourceBookmarkRepository } from '../../../domain-server/repositories/IResourceBookmarkRepository';

export class DeleteResourceBookmark {
  constructor(private readonly bookmarkRepository: IResourceBookmarkRepository) {}

  async execute(input: {
    repositoryId: string;
    identityId: string;
    bookmarkId: string;
  }): Promise<void> {
    await this.bookmarkRepository.delete(input);
  }
}
