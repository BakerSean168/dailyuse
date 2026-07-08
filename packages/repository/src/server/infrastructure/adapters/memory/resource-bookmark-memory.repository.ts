import type { ResourceBookmarkServerDTO } from '@dailyuse/contracts/repository';
import type { BookmarkId, ResourceId, IdentityId } from '@dailyuse/contracts/primitives';
import type {
  CreateResourceBookmarkInput,
  DeleteResourceBookmarkInput,
  IResourceBookmarkRepository,
  ReorderResourceBookmarksInput,
  UpdateResourceBookmarkInput,
} from '../../../domain/repositories/i-resource-bookmark-repository';

export class ResourceBookmarkMemoryRepository implements IResourceBookmarkRepository {
  private readonly data = new Map<string, ResourceBookmarkServerDTO[]>();

  async list(repositoryId: string, identityId: string): Promise<ResourceBookmarkServerDTO[]> {
    return [...(this.data.get(this.key(repositoryId, identityId)) ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  async create(input: CreateResourceBookmarkInput): Promise<ResourceBookmarkServerDTO> {
    const items = await this.list(input.repositoryId, input.identityId);
    const created: ResourceBookmarkServerDTO = {
      id: toBookmarkId(`${input.repositoryId}:${input.identityId}:${input.resourceId}`),
      resourceId: input.resourceId as ResourceId,
      identityId: input.identityId as IdentityId,
      aliasName: input.aliasName ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      sortOrder: items.length,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
    };
    this.data.set(this.key(input.repositoryId, input.identityId), [...items, created]);
    return created;
  }

  async update(input: UpdateResourceBookmarkInput): Promise<ResourceBookmarkServerDTO> {
    const items = await this.list(input.repositoryId, input.identityId);
    const next = items.map((item) =>
      item.id === input.bookmarkId
        ? {
            ...item,
            aliasName: input.aliasName !== undefined ? input.aliasName : item.aliasName,
            icon: input.icon !== undefined ? input.icon : item.icon,
            color: input.color !== undefined ? input.color : item.color,
            updatedAt: Date.now(),
            version: item.version + 1,
          }
        : item,
    );
    this.data.set(this.key(input.repositoryId, input.identityId), next);
    const updated = next.find((item) => item.id === input.bookmarkId);
    if (!updated) throw new Error(`Bookmark not found: ${input.bookmarkId}`);
    return updated;
  }

  async reorder(input: ReorderResourceBookmarksInput): Promise<ResourceBookmarkServerDTO[]> {
    const items = await this.list(input.repositoryId, input.identityId);
    const map = new Map<BookmarkId, ResourceBookmarkServerDTO>(items.map((item) => [item.id, item]));
    const next = input.bookmarkIds.map((id, index) => {
      const bookmark = map.get(id);
      if (!bookmark) throw new Error(`Bookmark not found: ${id}`);
      return {
        ...bookmark,
        sortOrder: index,
        updatedAt: Date.now(),
        version: bookmark.version + 1,
      };
    });
    this.data.set(this.key(input.repositoryId, input.identityId), next);
    return next;
  }

  async delete(input: DeleteResourceBookmarkInput): Promise<void> {
    const items = await this.list(input.repositoryId, input.identityId);
    this.data.set(
      this.key(input.repositoryId, input.identityId),
      items
        .filter((item) => item.id !== input.bookmarkId)
        .map((item, index) => ({ ...item, sortOrder: index })),
    );
  }

  private key(repositoryId: string, identityId: string): string {
    return `${repositoryId}:${identityId}`;
  }
}

function toBookmarkId(value: string): BookmarkId {
  return value as BookmarkId;
}
