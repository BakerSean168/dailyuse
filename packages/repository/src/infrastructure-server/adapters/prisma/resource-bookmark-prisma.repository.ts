import type { PrismaClient } from '@dailyuse/database';
import type { ResourceBookmarkServerDTO } from '@dailyuse/contracts/repository';
import type { BookmarkId, ResourceId, IdentityId } from '@dailyuse/contracts/primitives';
import type {
  CreateResourceBookmarkInput,
  DeleteResourceBookmarkInput,
  IResourceBookmarkRepository,
  ReorderResourceBookmarksInput,
  UpdateResourceBookmarkInput,
} from '../../../domain-server/repositories/IResourceBookmarkRepository';

type StoredBookmark = {
  path: string;
  aliasName?: string | null;
  icon?: string | null;
  color?: string | null;
};

type ResourceRow = {
  id: string;
  path: string;
  name: string;
};

export class ResourceBookmarkPrismaRepository implements IResourceBookmarkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(repositoryId: string, identityId: string): Promise<ResourceBookmarkServerDTO[]> {
    const explorer = await this.prisma.repositoryExplorer.findUnique({
      where: { repositoryId_identityId: { repositoryId, identityId } },
    });
    const stored = this.parsePinnedPaths(explorer?.pinnedPaths);
    if (stored.length === 0) {
      return [];
    }

    const resources = await this.prisma.resource.findMany({
      where: {
        repositoryId,
        path: { in: stored.map((item) => item.path) },
      },
      select: { id: true, path: true, name: true },
    });
    return this.mapToBookmarks(repositoryId, identityId, stored, resources, explorer);
  }

  async create(input: CreateResourceBookmarkInput): Promise<ResourceBookmarkServerDTO> {
    const resource = await this.prisma.resource.findFirst({
      where: { id: input.resourceId, repositoryId: input.repositoryId },
      select: { id: true, path: true, name: true },
    });
    if (!resource) {
      throw new Error(`Resource not found: ${input.resourceId}`);
    }

    const explorer = await this.prisma.repositoryExplorer.findUnique({
      where: {
        repositoryId_identityId: {
          repositoryId: input.repositoryId,
          identityId: input.identityId,
        },
      },
    });
    const stored = this.parsePinnedPaths(explorer?.pinnedPaths).filter(
      (item) => item.path !== resource.path,
    );
    stored.push({
      path: resource.path,
      aliasName: input.aliasName ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
    });

    await this.persist(input.repositoryId, input.identityId, stored);
    const updated = await this.list(input.repositoryId, input.identityId);
    const bookmark = updated.find((item) => item.resourceId === input.resourceId);
    if (!bookmark) {
      throw new Error('Failed to create bookmark');
    }
    return bookmark;
  }

  async update(input: UpdateResourceBookmarkInput): Promise<ResourceBookmarkServerDTO> {
    const explorer = await this.prisma.repositoryExplorer.findUnique({
      where: {
        repositoryId_identityId: {
          repositoryId: input.repositoryId,
          identityId: input.identityId,
        },
      },
    });
    const stored = this.parsePinnedPaths(explorer?.pinnedPaths);
    const resources = await this.prisma.resource.findMany({
      where: {
        repositoryId: input.repositoryId,
        path: { in: stored.map((item) => item.path) },
      },
      select: { id: true, path: true, name: true },
    });
    const current = this.mapToBookmarks(
      input.repositoryId,
      input.identityId,
      stored,
      resources,
      explorer,
    );
    const target = current.find((bookmark) => bookmark.id === input.bookmarkId);
    if (!target) {
      throw new Error(`Bookmark not found: ${input.bookmarkId}`);
    }

    const nextStored = stored.map((item) => {
      if (item.path !== targetPathForBookmark(target, resources)) {
        return item;
      }

      return {
        path: item.path,
        aliasName: input.aliasName !== undefined ? input.aliasName : (item.aliasName ?? null),
        icon: input.icon !== undefined ? input.icon : (item.icon ?? null),
        color: input.color !== undefined ? input.color : (item.color ?? null),
      };
    });

    await this.persist(input.repositoryId, input.identityId, nextStored);
    const updated = await this.list(input.repositoryId, input.identityId);
    const bookmark = updated.find((item) => item.id === input.bookmarkId);
    if (!bookmark) {
      throw new Error(`Bookmark not found: ${input.bookmarkId}`);
    }
    return bookmark;
  }

  async reorder(input: ReorderResourceBookmarksInput): Promise<ResourceBookmarkServerDTO[]> {
    const explorer = await this.prisma.repositoryExplorer.findUnique({
      where: {
        repositoryId_identityId: {
          repositoryId: input.repositoryId,
          identityId: input.identityId,
        },
      },
    });
    const stored = this.parsePinnedPaths(explorer?.pinnedPaths);
    const resources = await this.prisma.resource.findMany({
      where: {
        repositoryId: input.repositoryId,
        path: { in: stored.map((item) => item.path) },
      },
      select: { id: true, path: true, name: true },
    });
    const current = this.mapToBookmarks(
      input.repositoryId,
      input.identityId,
      stored,
      resources,
      explorer,
    );
    const pathByBookmarkId = new Map<BookmarkId, string>(
      current.map((bookmark) => [bookmark.id, targetPathForBookmark(bookmark, resources)]),
    );

    const nextStored = input.bookmarkIds.map((bookmarkId) => {
      const path = pathByBookmarkId.get(bookmarkId);
      if (!path) {
        throw new Error(`Bookmark not found: ${bookmarkId}`);
      }
      const item = stored.find((entry) => entry.path === path);
      if (!item) {
        throw new Error(`Bookmark path not found: ${bookmarkId}`);
      }
      return item;
    });

    if (nextStored.length !== stored.length) {
      throw new Error('Bookmark reorder payload does not match current bookmarks');
    }

    await this.persist(input.repositoryId, input.identityId, nextStored);
    return this.list(input.repositoryId, input.identityId);
  }

  async delete(input: DeleteResourceBookmarkInput): Promise<void> {
    const explorer = await this.prisma.repositoryExplorer.findUnique({
      where: {
        repositoryId_identityId: {
          repositoryId: input.repositoryId,
          identityId: input.identityId,
        },
      },
    });
    const stored = this.parsePinnedPaths(explorer?.pinnedPaths);
    const resources = await this.prisma.resource.findMany({
      where: {
        repositoryId: input.repositoryId,
        path: { in: stored.map((item) => item.path) },
      },
      select: { id: true, path: true, name: true },
    });
    const current = this.mapToBookmarks(
      input.repositoryId,
      input.identityId,
      stored,
      resources,
      explorer,
    );
    const target = current.find((bookmark) => bookmark.id === input.bookmarkId);
    if (!target) {
      return;
    }

    const targetPath = targetPathForBookmark(target, resources);
    await this.persist(
      input.repositoryId,
      input.identityId,
      stored.filter((item) => item.path !== targetPath),
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

  private mapToBookmarks(
    repositoryId: string,
    identityId: string,
    stored: StoredBookmark[],
    resources: ResourceRow[],
    explorer: { createdAt: Date; updatedAt: Date } | null,
  ): ResourceBookmarkServerDTO[] {
    const resourceByPath = new Map(resources.map((resource) => [resource.path, resource]));
    const createdAt = explorer?.createdAt?.getTime() ?? Date.now();
    const updatedAt = explorer?.updatedAt?.getTime() ?? createdAt;

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

  private async persist(
    repositoryId: string,
    identityId: string,
    bookmarks: StoredBookmark[],
  ): Promise<void> {
    await this.prisma.repositoryExplorer.upsert({
      where: { repositoryId_identityId: { repositoryId, identityId } },
      create: {
        id: `${repositoryId}:${identityId}`,
        repositoryId,
        identityId,
        name: 'Repository Explorer',
        currentPath: '/',
        pinnedPaths: JSON.stringify(bookmarks),
      },
      update: {
        pinnedPaths: JSON.stringify(bookmarks),
      },
    });
  }
}

function targetPathForBookmark(
  bookmark: ResourceBookmarkServerDTO,
  resources: ResourceRow[],
): string {
  const resource = resources.find((item) => item.id === bookmark.resourceId);
  if (!resource) {
    throw new Error(`Resource not found for bookmark: ${bookmark.id}`);
  }
  return resource.path;
}

function toBookmarkId(value: string): BookmarkId {
  return value as BookmarkId;
}
