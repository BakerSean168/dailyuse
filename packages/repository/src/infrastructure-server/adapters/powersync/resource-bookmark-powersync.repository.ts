import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { ResourceBookmarkServerDTO } from '@dailyuse/contracts/repository';
import type { BookmarkId, ResourceId, IdentityId } from '@dailyuse/contracts/primitives';
import type {
  CreateResourceBookmarkInput,
  DeleteResourceBookmarkInput,
  IResourceBookmarkRepository,
  ReorderResourceBookmarksInput,
  UpdateResourceBookmarkInput,
} from '../../../domain-server/repositories/i-resource-bookmark-repository';

interface RepositoryExplorerRow {
  id: string;
  repository_id: string;
  identity_id: string;
  pinned_paths: string | null;
  created_at: string;
  updated_at: string;
}

interface ResourceRow {
  id: string;
  path: string;
  name: string;
}

type StoredBookmark = {
  path: string;
  aliasName?: string | null;
  icon?: string | null;
  color?: string | null;
};

export class ResourceBookmarkPowerSyncRepository implements IResourceBookmarkRepository {
  constructor(private readonly db: IElectronDatabase) {}

  async list(repositoryId: string, identityId: string): Promise<ResourceBookmarkServerDTO[]> {
    const explorer = await this.db.getOptional<RepositoryExplorerRow>(
      `SELECT * FROM repository_explorers WHERE repository_id = ? AND identity_id = ? LIMIT 1`,
      [repositoryId, identityId],
    );
    const stored = this.parsePinnedPaths(explorer?.pinned_paths);
    if (stored.length === 0) return [];

    const resources = await this.db.getAll<ResourceRow>(
      `SELECT id, path, name FROM resources WHERE repository_id = ?`,
      [repositoryId],
    );
    const resourceByPath = new Map(resources.map((resource) => [resource.path, resource]));
    const createdAt = explorer?.created_at ? new Date(explorer.created_at).getTime() : Date.now();
    const updatedAt = explorer?.updated_at ? new Date(explorer.updated_at).getTime() : createdAt;

    return stored.flatMap((item, index) => {
      const resource = resourceByPath.get(item.path);
      if (!resource) return [];
      return [
        {
          id: toBookmarkId(`${repositoryId}:${identityId}:${resource.id}`),
          resourceId: resource.id as ResourceId,
          identityId: identityId as IdentityId,
          aliasName: item.aliasName ?? null,
          icon: item.icon ?? null,
          color: item.color ?? null,
          sortOrder: index,
          version: 1,
          createdAt,
          updatedAt,
          deletedAt: null,
        } satisfies ResourceBookmarkServerDTO,
      ];
    });
  }

  async create(input: CreateResourceBookmarkInput): Promise<ResourceBookmarkServerDTO> {
    const resource = await this.db.getOptional<ResourceRow>(
      `SELECT id, path, name FROM resources WHERE id = ? AND repository_id = ? LIMIT 1`,
      [input.resourceId, input.repositoryId],
    );
    if (!resource) throw new Error(`Resource not found: ${input.resourceId}`);

    const bookmarks = await this.list(input.repositoryId, input.identityId);
    const existing = bookmarks.find((bookmark) => bookmark.resourceId === input.resourceId);
    if (existing) {
      return this.update({
        repositoryId: input.repositoryId,
        identityId: input.identityId,
        bookmarkId: existing.id,
        aliasName: input.aliasName ?? null,
        icon: input.icon ?? null,
        color: input.color ?? null,
      });
    }

    await this.persist(input.repositoryId, input.identityId, [
      ...bookmarks,
      {
        id: toBookmarkId(`${input.repositoryId}:${input.identityId}:${input.resourceId}`),
        resourceId: input.resourceId as ResourceId,
        identityId: input.identityId as IdentityId,
        aliasName: input.aliasName ?? null,
        icon: input.icon ?? null,
        color: input.color ?? null,
        sortOrder: bookmarks.length,
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
      },
    ]);
    const updated = await this.list(input.repositoryId, input.identityId);
    const bookmark = updated.find((item) => item.resourceId === input.resourceId);
    if (!bookmark) throw new Error('Failed to create bookmark');
    return bookmark;
  }

  async update(input: UpdateResourceBookmarkInput): Promise<ResourceBookmarkServerDTO> {
    const bookmarks = await this.list(input.repositoryId, input.identityId);
    const next = bookmarks.map((bookmark) =>
      bookmark.id === input.bookmarkId
        ? {
            ...bookmark,
            aliasName: input.aliasName !== undefined ? input.aliasName : bookmark.aliasName,
            icon: input.icon !== undefined ? input.icon : bookmark.icon,
            color: input.color !== undefined ? input.color : bookmark.color,
          }
        : bookmark,
    );
    await this.persist(input.repositoryId, input.identityId, next);
    const updated = next.find((bookmark) => bookmark.id === input.bookmarkId);
    if (!updated) throw new Error(`Bookmark not found: ${input.bookmarkId}`);
    return updated;
  }

  async reorder(input: ReorderResourceBookmarksInput): Promise<ResourceBookmarkServerDTO[]> {
    const bookmarks = await this.list(input.repositoryId, input.identityId);
    const map = new Map<BookmarkId, ResourceBookmarkServerDTO>(
      bookmarks.map((bookmark) => [bookmark.id, bookmark]),
    );
    const next = input.bookmarkIds.map((id, index) => {
      const bookmark = map.get(id);
      if (!bookmark) throw new Error(`Bookmark not found: ${id}`);
      return { ...bookmark, sortOrder: index };
    });
    await this.persist(input.repositoryId, input.identityId, next);
    return this.list(input.repositoryId, input.identityId);
  }

  async delete(input: DeleteResourceBookmarkInput): Promise<void> {
    const bookmarks = await this.list(input.repositoryId, input.identityId);
    await this.persist(
      input.repositoryId,
      input.identityId,
      bookmarks.filter((bookmark) => bookmark.id !== input.bookmarkId),
    );
  }

  private parsePinnedPaths(raw: string | null | undefined): StoredBookmark[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => (typeof item === 'string' ? { path: item } : item))
        .filter(
          (item): item is StoredBookmark => typeof item?.path === 'string' && item.path.length > 0,
        );
    } catch {
      return [];
    }
  }

  private async persist(
    repositoryId: string,
    identityId: string,
    bookmarks: ResourceBookmarkServerDTO[],
  ): Promise<void> {
    const resources = await this.db.getAll<ResourceRow>(
      `SELECT id, path, name FROM resources WHERE repository_id = ?`,
      [repositoryId],
    );
    const pathByResourceId = new Map(resources.map((resource) => [resource.id, resource.path]));
    const pinnedPaths = JSON.stringify(
      bookmarks
        .map((bookmark) => ({
          path: pathByResourceId.get(bookmark.resourceId) ?? '',
          aliasName: bookmark.aliasName,
          icon: bookmark.icon,
          color: bookmark.color,
        }))
        .filter((item) => item.path),
    );

    const existing = await this.db.getOptional<{ id: string }>(
      `SELECT id FROM repository_explorers WHERE repository_id = ? AND identity_id = ? LIMIT 1`,
      [repositoryId, identityId],
    );
    const now = new Date().toISOString();

    if (existing) {
      await this.db.execute(
        `UPDATE repository_explorers SET pinned_paths = ?, updated_at = ? WHERE repository_id = ? AND identity_id = ?`,
        [pinnedPaths, now, repositoryId, identityId],
      );
      return;
    }

    await this.db.execute(
      `INSERT INTO repository_explorers (id, repository_id, identity_id, name, current_path, pinned_paths, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${repositoryId}:${identityId}`,
        repositoryId,
        identityId,
        'Repository Explorer',
        '/',
        pinnedPaths,
        now,
        now,
      ],
    );
  }
}

function toBookmarkId(value: string): BookmarkId {
  return value as BookmarkId;
}
