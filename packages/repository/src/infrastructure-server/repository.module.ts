/**
 * createRepositoryModule — explicit composition root for the repository server runtime.
 * createRepositoryModule —— 仓库模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * Repository uses this file as the module's composition root following the
 * governance canonical pattern: one composition root per module, constructor
 * injection only, no hidden service locator.
 *
 * 仓库模块遵循治理模块的规范模式：每个模块一个组合根，
 * 仅使用构造函数注入，不使用隐藏的服务定位器。
 */

import type { IRepositoryRepository } from '../domain-server/repositories/IRepositoryRepository';
import type { IResourceRepository } from '../domain-server/repositories/IResourceRepository';
import type { IFolderRepository } from '../domain-server/repositories/IFolderRepository';
import type { IResourceBookmarkRepository } from '../domain-server/repositories/IResourceBookmarkRepository';
import type { IStoragePort } from '../application-server/ports/IStoragePort';
import {
  CreateRepositoryUseCase,
  UpdateRepositoryStatsUseCase,
  GetResourceUseCase,
  ListResourcesUseCase,
  CreateResourceUseCase,
  UpdateResourceContentUseCase,
  UploadResourcesUseCase,
  CreateFolderUseCase,
  GetFolderUseCase,
  GetFolderTreeUseCase,
  RenameFolderUseCase,
  MoveFolderUseCase,
  DeleteFolderUseCase,
  CreateResourceBookmarkUseCase,
  UpdateResourceBookmarkUseCase,
  ReorderResourceBookmarksUseCase,
  DeleteResourceBookmarkUseCase,
  ListResourceBookmarksUseCase,
  DeleteResourceUseCase,
} from '../application-server';
import { ok, error } from '@dailyuse/contracts/result';
import type { Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import { RepositoryStatus } from '@dailyuse/contracts/repository';
import {
  REPOSITORY_RESOURCE_MUTATED_EVENT,
  RepositoryResourceMutationType,
  type RepositoryResourceMutatedEvent,
} from '@dailyuse/contracts/repository';
import { PathCalculator } from '../domain-server/services/PathCalculator';
import { eventBus } from '@dailyuse/utils';

const repositoryEventBus = eventBus as unknown as {
  send(eventType: string, payload: unknown): void;
};

// ---------------------------------------------------------------------------
// Dependencies — 依赖类型
// ---------------------------------------------------------------------------

/**
 * Everything the repository server runtime needs from the outside world.
 * 仓库模块服务端运行时向外部索取的全部依赖。
 *
 * Refactor rule for other modules:
 * 重构规则：
 * - only put ports or runtime contributions here
 *   这里只放端口或运行时贡献
 * - never put transport objects (Express req/res, ipcMain, Router) here
 *   绝不在此放传输对象（Express req/res、ipcMain、Router）
 * - never hide these dependencies behind a singleton container
 *   绝不将依赖隐藏在单例容器之后
 */
export type RepositoryRuntimeContributionsInput =
  | RepositoryModuleRuntimeContribution
  | readonly RepositoryModuleRuntimeContribution[];

export interface RepositoryModuleDependencies {
  readonly repositoryRepository: IRepositoryRepository;
  readonly resourceRepository: IResourceRepository;
  readonly folderRepository: IFolderRepository;
  readonly resourceBookmarkRepository: IResourceBookmarkRepository;
  readonly storagePort: IStoragePort;
  readonly runtimeContributions?: RepositoryRuntimeContributionsInput;
  readonly autoCreateCanonicalRepository?: boolean;
}

// ---------------------------------------------------------------------------
// Runtime contribution — 运行时贡献
// ---------------------------------------------------------------------------

/**
 * Module-owned runtime side effects.
 * 模块拥有的运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This is the replacement for older global initialization hooks.
 *
 * 一个贡献是我们与模块实例一起启动/停止的单元。
 * 它替代了旧的全局初始化钩子。
 */
export interface RepositoryModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

// ---------------------------------------------------------------------------
// Use cases — 用例集合
// ---------------------------------------------------------------------------

/**
 * Lower-level assembled use cases.
 * 已完成接线的底层 use case 集合。
 *
 * We keep this type because tests and low-level assembly sometimes need direct
 * access to use-case objects, but transports should prefer `RepositoryApplicationPort`.
 *
 * 保留此类型供测试和低层组装使用；传输层应优先使用 RepositoryApplicationPort。
 */
export interface RepositoryModuleUseCases {
  readonly createRepository: CreateRepositoryUseCase;
  readonly updateRepositoryStats: UpdateRepositoryStatsUseCase;
  readonly getResource: GetResourceUseCase;
  readonly listResources: ListResourcesUseCase;
  readonly createResource: CreateResourceUseCase;
  readonly updateResourceContent: UpdateResourceContentUseCase;
  readonly uploadResources: UploadResourcesUseCase;
  readonly deleteResource: DeleteResourceUseCase;
  readonly createFolder: CreateFolderUseCase;
  readonly getFolder: GetFolderUseCase;
  readonly getFolderTree: GetFolderTreeUseCase;
  readonly renameFolder: RenameFolderUseCase;
  readonly moveFolder: MoveFolderUseCase;
  readonly deleteFolder: DeleteFolderUseCase;
  readonly createResourceBookmark: CreateResourceBookmarkUseCase;
  readonly updateResourceBookmark: UpdateResourceBookmarkUseCase;
  readonly reorderResourceBookmarks: ReorderResourceBookmarksUseCase;
  readonly deleteResourceBookmark: DeleteResourceBookmarkUseCase;
  readonly listResourceBookmarks: ListResourceBookmarksUseCase;
}

// ---------------------------------------------------------------------------
// Application port — 应用层门面
// ---------------------------------------------------------------------------

/**
 * Transport-neutral callable application surface.
 * 传输层无关的可调用应用层门面。
 *
 * Transports (HTTP routes, IPC handlers) call only these methods.
 * The `RepositoryUseCases` type in the controller is structurally compatible.
 *
 * 传输层（HTTP 路由、IPC 处理器）只调用这些方法。
 * 控制器中的 RepositoryUseCases 类型与之结构兼容。
 */
export interface RepositoryApplicationPort {
  getCurrentRepository(ctx: Context): Promise<Result<unknown>>;

  // Resource CRUD — 资源增删改查
  createResource(
    data: {
      repositoryId: string;
      folderId?: string;
      name: string;
      type: string;
      path?: string;
      content?: string;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  listResources(
    repositoryId: string,
    filters?: { folderId?: string; status?: string },
  ): Promise<Result<unknown>>;
  getResource(id: string): Promise<Result<unknown>>;
  updateResource(
    id: string,
    data: {
      name?: string;
      metadata?: Record<string, unknown>;
      content?: string;
    },
  ): Promise<Result<unknown>>;
  moveResource(id: string, targetFolderId: string): Promise<Result<unknown>>;
  deleteResource(id: string): Promise<Result<unknown>>;
  uploadResources(
    data: {
      repositoryId: string;
      files: unknown[];
      metadata?: unknown;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;

  // Repository stats — 仓库统计
  updateRepositoryStats(id: string, data: Record<string, unknown>): Promise<Result<unknown>>;

  // Folder CRUD — 文件夹增删改查
  createFolder(
    data: {
      repositoryId: string;
      name: string;
      parentId?: string;
      order?: number;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  getFolderTree(repositoryId: string): Promise<Result<unknown>>;
  getFolder(id: string): Promise<Result<unknown>>;
  renameFolder(id: string, newName: string): Promise<Result<unknown>>;
  moveFolder(id: string, newParentId: string | null): Promise<Result<unknown>>;
  deleteFolder(id: string): Promise<Result<unknown>>;

  // Bookmark CRUD — 书签增删改查
  listResourceBookmarks(repositoryId: string, ctx: Context): Promise<Result<unknown>>;
  createResourceBookmark(
    repositoryId: string,
    data: {
      resourceId: string;
      aliasName?: string;
      icon?: string;
      color?: string;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  updateResourceBookmark(
    repositoryId: string,
    bookmarkId: string,
    data: {
      aliasName?: string;
      icon?: string;
      color?: string;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  reorderResourceBookmarks(
    repositoryId: string,
    data: {
      bookmarkIds: string[];
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  deleteResourceBookmark(
    repositoryId: string,
    bookmarkId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;

  // Repository resolution — 仓库解析
  /**
   * Find the first active repository for the given identity.
   * 查找给定身份的第一个活跃仓库。
   *
   * Falls back to any repository owned by the identity when no active one exists.
   * Useful for external modules (e.g. AI knowledge-note persistence) that need to
   * resolve a repository without direct access to the repository repository.
   *
   * 当没有活跃仓库时回退到该身份拥有的任何仓库。
   * 供外部模块（如 AI 知识笔记持久化）在不直接访问仓储的情况下解析仓库。
   */
  findActiveRepository(identityId: string): Promise<Result<unknown>>;
}

// ---------------------------------------------------------------------------
// Module instance — 模块实例
// ---------------------------------------------------------------------------

/**
 * Primary repository composition root return type.
 * 仓库模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `useCases` is kept for low-level tests and diagnostics.
 * `start` / `dispose` own runtime side effects.
 *
 * `api` 是面向传输层的表面。
 * `useCases` 保留给低层测试和诊断使用。
 * `start` / `dispose` 管理运行时副作用。
 */
export interface RepositoryModuleInstance {
  readonly repositoryRepository: IRepositoryRepository;
  readonly resourceRepository: IResourceRepository;
  readonly folderRepository: IFolderRepository;
  readonly resourceBookmarkRepository: IResourceBookmarkRepository;
  readonly useCases: RepositoryModuleUseCases;
  readonly api: RepositoryApplicationPort;
  start(): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Assembly helpers — 组装辅助函数
// ---------------------------------------------------------------------------

/**
 * Pure assembly helper used by the composition root and tests.
 * 纯组装函数：给定依赖对象，返回已经接好线的 use case 集合。
 */
export function createRepositoryUseCases(
  deps: RepositoryModuleDependencies,
): RepositoryModuleUseCases {
  const {
    repositoryRepository,
    resourceRepository,
    folderRepository,
    resourceBookmarkRepository,
    storagePort,
  } = deps;

  const createResource = new CreateResourceUseCase(resourceRepository, repositoryRepository, storagePort);
  const deleteResource = new DeleteResourceUseCase(resourceRepository, repositoryRepository, storagePort);
  const updateResourceContent = new UpdateResourceContentUseCase(
    resourceRepository,
    repositoryRepository,
    storagePort,
  );

  return {
    createRepository: new CreateRepositoryUseCase(repositoryRepository),
    updateRepositoryStats: new UpdateRepositoryStatsUseCase(repositoryRepository),
    getResource: new GetResourceUseCase(resourceRepository),
    listResources: new ListResourcesUseCase(resourceRepository),
    createResource,
    updateResourceContent,
    uploadResources: new UploadResourcesUseCase(
      createResource,
      deleteResource,
      resourceRepository,
      repositoryRepository,
      folderRepository,
    ),
    deleteResource,
    createFolder: new CreateFolderUseCase(folderRepository, repositoryRepository, storagePort),
    getFolder: new GetFolderUseCase(folderRepository),
    getFolderTree: new GetFolderTreeUseCase(folderRepository),
    renameFolder: new RenameFolderUseCase(
      folderRepository,
      resourceRepository,
      repositoryRepository,
      storagePort,
    ),
    moveFolder: new MoveFolderUseCase(
      folderRepository,
      resourceRepository,
      repositoryRepository,
      storagePort,
    ),
    deleteFolder: new DeleteFolderUseCase(
      folderRepository,
      resourceRepository,
      repositoryRepository,
      storagePort,
    ),
    createResourceBookmark: new CreateResourceBookmarkUseCase(
      resourceBookmarkRepository,
      resourceRepository,
    ),
    updateResourceBookmark: new UpdateResourceBookmarkUseCase(
      resourceBookmarkRepository,
      resourceRepository,
    ),
    reorderResourceBookmarks: new ReorderResourceBookmarksUseCase(
      resourceBookmarkRepository,
      resourceRepository,
    ),
    deleteResourceBookmark: new DeleteResourceBookmarkUseCase(resourceBookmarkRepository),
    listResourceBookmarks: new ListResourceBookmarksUseCase(
      resourceBookmarkRepository,
      resourceRepository,
    ),
  };
}

function normalizeRuntimeContributions(
  runtimeContributions?:
    | RepositoryModuleRuntimeContribution
    | ReadonlyArray<RepositoryModuleRuntimeContribution>,
): readonly RepositoryModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as RepositoryModuleRuntimeContribution];
}

// ---------------------------------------------------------------------------
// Application port builder — 应用层门面构建
// ---------------------------------------------------------------------------

/**
 * Builds the transport-neutral application port from assembled use cases.
 * 从已组装的 use case 构建传输层无关的应用层门面。
 *
 * Use cases now return Result<T>. The api is a thin passthrough —
 * failed Results propagate directly, successful Results may be
 * unwrapped and re-wrapped when the api produces different data.
 *
 * 用例现在返回 Result<T>。api 层是薄透传——
 * 失败的 Result 直接传播，成功的 Result 在 api 产出不同数据时解包再包装。
 */
function buildApplicationPort(
  useCases: RepositoryModuleUseCases,
  deps: RepositoryModuleDependencies,
): RepositoryApplicationPort {
  const { resourceRepository, folderRepository, repositoryRepository, storagePort } = deps;

  async function hydrateStoredResourceContent<T extends { repositoryId: string; path: string; content: string | null; mimeType: string }>(
    resource: T | null,
  ): Promise<T | null> {
    if (!resource || resource.content) {
      return resource;
    }

    const storedBytes = await storagePort.read({
      repositoryId: resource.repositoryId,
      path: resource.path,
    });
    if (!storedBytes) {
      return resource;
    }

    const textLike =
      resource.mimeType.startsWith('text/') || resource.mimeType === 'application/json';

    return {
      ...resource,
      content: textLike
        ? Buffer.from(storedBytes).toString('utf8')
        : Buffer.from(storedBytes).toString('base64'),
    };
  }

  async function resolveParentPath(folderId?: string | null): Promise<Result<string | null>> {
    if (!folderId) {
      return ok(null);
    }

    const folder = await folderRepository.findById(folderId);
    if (!folder) {
      return error('NOT_FOUND', `Folder not found: ${folderId}`);
    }

    return ok(folder.path);
  }

  async function ensureResourcePathAvailable(
    repositoryId: string,
    path: string,
    currentResourceId: string,
  ): Promise<Result<void>> {
    const existing = await resourceRepository.findByRepositoryIdAndPath(repositoryId, path);
    if (existing && String(existing.id) !== currentResourceId) {
      return error('CONFLICT', `Resource already exists at path: ${path}`);
    }
    return ok(undefined);
  }

  async function moveResourceInStorage(
    resourceId: string,
    nextName?: string,
    nextFolderId?: string | null,
  ) {
    const resource = await resourceRepository.findById(resourceId);
    if (!resource) {
      return error('NOT_FOUND', `Resource not found: ${resourceId}`);
    }

    const repository = await repositoryRepository.findById(String(resource.repositoryId));
    if (!repository) {
      return error('NOT_FOUND', `Repository not found: ${resource.repositoryId}`);
    }

    const targetFolderId = nextFolderId === undefined ? resource.folderId : nextFolderId;
    const targetName = nextName ?? resource.name;
    const parentPathResult = await resolveParentPath(targetFolderId);
    if (!parentPathResult.ok) return parentPathResult;
    const parentPath = parentPathResult.data;
    const targetPath = PathCalculator.buildPath(parentPath, targetName);

    if (targetPath === resource.path) {
      return ok(resource);
    }

    const pathAvailableResult = await ensureResourcePathAvailable(
      String(resource.repositoryId),
      targetPath,
      String(resource.id),
    );
    if (!pathAvailableResult.ok) return pathAvailableResult;

    await storagePort.move({
      repositoryId: String(repository.id),
      fromPath: resource.path,
      toPath: targetPath,
      isFolder: false,
    });

    if (nextName !== undefined) {
      resource.rename(targetName);
    }
    if (nextFolderId !== undefined) {
      resource.moveTo(targetFolderId as any, targetPath);
    } else if (nextName !== undefined) {
      resource.moveTo(resource.folderId, targetPath);
    }

    await resourceRepository.save(resource);
    return ok(resource);
  }

  async function resolveCanonicalRepository(identityId: string) {
    const activeRepos = await repositoryRepository.findByIdentityIdAndStatus(
      identityId,
      RepositoryStatus.Active,
    );
    const repository =
      activeRepos[0] ?? (await repositoryRepository.findByIdentityId(identityId))[0];

    if (!repository) {
      return error('NOT_FOUND', `No repository available for identity: ${identityId}`);
    }

    return ok(repository.toClientDTO());
  }

  async function ensureCanonicalRepository(identityId: string) {
    const existing = await resolveCanonicalRepository(identityId);
    if (existing.ok) {
      return existing;
    }

    if (existing.error.code !== 'NOT_FOUND') {
      return existing;
    }

    if (deps.autoCreateCanonicalRepository === false) {
      return existing;
    }

    const result = await useCases.createRepository.execute({
      identityId,
      name: 'Knowledge Base',
      type: 'Markdown' as any,
      path: 'knowledge-base',
    });

    if (!result.ok) return result;
    return ok(result.data.repository);
  }

  function emitResourceMutationEvent(
    payload: Omit<RepositoryResourceMutatedEvent, 'timestamp'>,
  ): void {
    repositoryEventBus.send(REPOSITORY_RESOURCE_MUTATED_EVENT, {
      ...payload,
      timestamp: Date.now(),
    } satisfies RepositoryResourceMutatedEvent);
  }

  return {
    getCurrentRepository: async (ctx) => {
      return ensureCanonicalRepository(ctx.identityId);
    },

    // ---- Resource CRUD — 资源增删改查 ----
    createResource: async (data, ctx) => {
      const result = await useCases.createResource.execute({
        repositoryId: data.repositoryId,
        identityId: ctx.identityId,
        folderId: data.folderId,
        name: data.name,
        type: data.type as any,
        path: data.path ?? `/${data.name}`,
        content: data.content,
      });
      if (!result.ok) return result;

      const createdResource = await resourceRepository.findById(String(result.data.resource.id));
      if (createdResource) {
        emitResourceMutationEvent({
          identityId: createdResource.identityId,
          repositoryId: String(createdResource.repositoryId),
          resourceId: String(createdResource.id),
          resourcePath: createdResource.path,
          mutation: RepositoryResourceMutationType.Created,
        });
      }
      return ok(result.data.resource);
    },
    listResources: async (repositoryId) => {
      return useCases.listResources.execute({ repositoryId });
    },
    getResource: async (id) => {
      const result = await useCases.getResource.execute({ id });
      if (!result.ok) return result;
      return ok(await hydrateStoredResourceContent(result.data.resource));
    },
    updateResource: async (id, data) => {
      let currentResource = await resourceRepository.findById(id);
      if (!currentResource) {
        return error('NOT_FOUND', `Resource not found: ${id}`);
      }
      const pathChanged = data.name !== undefined;

      if (pathChanged) {
        const moveResult = await moveResourceInStorage(id, data.name);
        if (!moveResult.ok) return moveResult;
        currentResource = moveResult.data;
      }

      if (data.metadata !== undefined) {
        currentResource.updateMetadata(data.metadata);
      }

      await resourceRepository.save(currentResource);

      if (data.content !== undefined) {
        const result = await useCases.updateResourceContent.execute({
          id,
          content: data.content,
        });
        if (!result.ok) return result;

        const updatedResource = await resourceRepository.findById(id);
        if (updatedResource) {
          emitResourceMutationEvent({
            identityId: updatedResource.identityId,
            repositoryId: String(updatedResource.repositoryId),
            resourceId: String(updatedResource.id),
            resourcePath: updatedResource.path,
            mutation: RepositoryResourceMutationType.ContentUpdated,
          });
        }
        return ok(result.data.resource);
      }

      if (pathChanged) {
        emitResourceMutationEvent({
          identityId: currentResource.identityId,
          repositoryId: String(currentResource.repositoryId),
          resourceId: String(currentResource.id),
          resourcePath: currentResource.path,
          mutation: RepositoryResourceMutationType.Moved,
        });
      }

      return ok(currentResource.toClientDTO());
    },
    moveResource: async (id, targetFolderId) => {
      const result = await moveResourceInStorage(id, undefined, targetFolderId);
      if (!result.ok) return result;

      emitResourceMutationEvent({
        identityId: result.data.identityId,
        repositoryId: String(result.data.repositoryId),
        resourceId: String(result.data.id),
        resourcePath: result.data.path,
        mutation: RepositoryResourceMutationType.Moved,
      });
      return ok(result.data.toClientDTO());
    },
    deleteResource: async (id) => {
      const resource = await resourceRepository.findById(id);
      const result = await useCases.deleteResource.execute({ id });
      if (!result.ok) return result;

      if (resource) {
        emitResourceMutationEvent({
          identityId: resource.identityId,
          repositoryId: String(resource.repositoryId),
          resourceId: String(resource.id),
          resourcePath: resource.path,
          mutation: RepositoryResourceMutationType.Deleted,
        });
      }
      return ok(undefined);
    },
    uploadResources: async (data, ctx) => {
      return useCases.uploadResources.execute({
        repositoryId: data.repositoryId,
        identityId: ctx.identityId,
        files: data.files as any,
        metadata: data.metadata as any,
      });
    },

    // ---- Repository stats — 仓库统计 ----
    updateRepositoryStats: async (id, data) => {
      return useCases.updateRepositoryStats.execute({ id, stats: data as any });
    },

    // ---- Folder CRUD — 文件夹增删改查 ----
    createFolder: async (data, ctx) => {
      return useCases.createFolder.execute({
        repositoryId: data.repositoryId,
        identityId: ctx.identityId,
        name: data.name,
        parentId: data.parentId,
        order: data.order,
      });
    },
    getFolderTree: async (repositoryId) => {
      return useCases.getFolderTree.execute({ repositoryId });
    },
    getFolder: async (id) => {
      return useCases.getFolder.execute({ id });
    },
    renameFolder: async (id, newName) => {
      return useCases.renameFolder.execute({ id, newName });
    },
    moveFolder: async (id, newParentId) => {
      return useCases.moveFolder.execute({ id, newParentId });
    },
    deleteFolder: async (id) => {
      return useCases.deleteFolder.execute({ id });
    },

    // ---- Bookmark CRUD — 书签增删改查 ----
    listResourceBookmarks: async (repositoryId, ctx) => {
      return useCases.listResourceBookmarks.execute({
        repositoryId,
        identityId: ctx.identityId,
      });
    },
    createResourceBookmark: async (repositoryId, data, ctx) => {
      return useCases.createResourceBookmark.execute({
        repositoryId,
        identityId: ctx.identityId,
        resourceId: data.resourceId,
        aliasName: data.aliasName,
        icon: data.icon,
        color: data.color,
      });
    },
    updateResourceBookmark: async (repositoryId, bookmarkId, data, ctx) => {
      return useCases.updateResourceBookmark.execute({
        repositoryId,
        identityId: ctx.identityId,
        bookmarkId,
        aliasName: data.aliasName,
        icon: data.icon,
        color: data.color,
      });
    },
    reorderResourceBookmarks: async (repositoryId, data, ctx) => {
      return useCases.reorderResourceBookmarks.execute({
        repositoryId,
        identityId: ctx.identityId,
        bookmarkIds: data.bookmarkIds,
      });
    },
    deleteResourceBookmark: async (repositoryId, bookmarkId, ctx) => {
      return useCases.deleteResourceBookmark.execute({
        repositoryId,
        identityId: ctx.identityId,
        bookmarkId,
      });
    },

    // ---- Repository resolution — 仓库解析 ----
    findActiveRepository: async (identityId) => {
      return ensureCanonicalRepository(identityId);
    },
  };
}

// ---------------------------------------------------------------------------
// Composition root — 组合根
// ---------------------------------------------------------------------------

/**
 * Canonical composition root.
 * 规范化的仓库模块主组合根。
 *
 * This is the file other modules should copy first when migrating away from a
 * container-based assembly. The expected reading order is:
 *
 * 这是其他模块从容器式组装迁移时应首先参照的文件。推荐阅读顺序：
 *
 * 1. define `Dependencies` — 定义依赖
 * 2. define transport-neutral `ApplicationPort` — 定义传输层无关的应用层门面
 * 3. assemble use cases once — 一次性组装 use case
 * 4. wrap them in `api` — 用 api 包装
 * 5. let the module instance own `start` / `dispose` — 模块实例管理 start / dispose
 */
export function createRepositoryModule(
  dependencies: RepositoryModuleDependencies,
): RepositoryModuleInstance {
  const { repositoryRepository, resourceRepository, folderRepository, resourceBookmarkRepository } =
    dependencies;

  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const useCases = createRepositoryUseCases(dependencies);
  let started = false;

  const api: RepositoryApplicationPort = buildApplicationPort(useCases, dependencies);

  return {
    repositoryRepository,
    resourceRepository,
    folderRepository,
    resourceBookmarkRepository,
    useCases,
    api,
    start(): void {
      if (started) {
        return;
      }

      for (const runtime of runtimeContributions) {
        runtime.start();
      }

      started = true;
    },
    dispose(): void {
      if (!started) {
        return;
      }

      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }

      started = false;
    },
  };
}
