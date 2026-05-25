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

import type { IRepositoryRepository } from '../domain-server/repositories/i-repository-repository';
import type { IResourceRepository } from '../domain-server/repositories/i-resource-repository';
import type { IFolderRepository } from '../domain-server/repositories/i-folder-repository';
import type { IResourceBookmarkRepository } from '../domain-server/repositories/i-resource-bookmark-repository';
import type { IStoragePort } from '../application-server/ports/i-storage-port';
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
import { RepositoryResolutionService } from '../application-server/services/repository-resolution.service';
import { StoredResourceHydrationService } from '../application-server/services/stored-resource-hydration.service';
import { ResourceMutationService } from '../application-server/services/resource-mutation.service';
import { ok } from '@dailyuse/contracts/result';
import type { BookmarkId } from '@dailyuse/contracts/primitives';
import type { Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type {
  ResourceClientDTO,
  UploadResourcesRequestDTO,
  UploadResourcesResponseDTO,
} from '@dailyuse/contracts/repository';

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
  ): Promise<Result<ResourceClientDTO>>;
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
  ): Promise<Result<ResourceClientDTO>>;
  moveResource(id: string, targetFolderId: string): Promise<Result<ResourceClientDTO>>;
  deleteResource(id: string): Promise<Result<void>>;
  uploadResources(
    data: {
      repositoryId: string;
      files: unknown[];
      metadata?: unknown;
    },
    ctx: Context,
  ): Promise<Result<UploadResourcesResponseDTO>>;

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

  const mutationService = new ResourceMutationService({
    resourceRepository,
    repositoryRepository,
    folderRepository,
    storagePort,
    createResource,
    deleteResource,
    updateResourceContent,
  });

  return {
    createRepository: new CreateRepositoryUseCase(repositoryRepository),
    updateRepositoryStats: new UpdateRepositoryStatsUseCase(repositoryRepository),
    getResource: new GetResourceUseCase(resourceRepository),
    listResources: new ListResourcesUseCase(resourceRepository),
    createResource,
    updateResourceContent,
    uploadResources: new UploadResourcesUseCase(
      mutationService,
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
  const repositoryResolution = new RepositoryResolutionService({
    repositoryRepository: deps.repositoryRepository,
    createRepository: useCases.createRepository,
    autoCreateCanonicalRepository: deps.autoCreateCanonicalRepository !== false,
  });

  const hydration = new StoredResourceHydrationService({
    storagePort: deps.storagePort,
  });

  const mutation = new ResourceMutationService({
    resourceRepository: deps.resourceRepository,
    repositoryRepository: deps.repositoryRepository,
    folderRepository: deps.folderRepository,
    storagePort: deps.storagePort,
    createResource: useCases.createResource,
    deleteResource: useCases.deleteResource,
    updateResourceContent: useCases.updateResourceContent,
  });

  return {
    getCurrentRepository: async (ctx) => {
      return repositoryResolution.ensureCanonicalRepository(ctx.identityId);
    },

    // ---- Resource CRUD — 资源增删改查 ----
    createResource: async (data, ctx) => {
      return mutation.createResource({
        repositoryId: data.repositoryId,
        identityId: ctx.identityId,
        folderId: data.folderId,
        name: data.name,
        type: data.type,
        path: data.path,
        content: data.content,
      });
    },
    listResources: async (repositoryId) => {
      return useCases.listResources.execute({ repositoryId });
    },
    getResource: async (id) => {
      const result = await useCases.getResource.execute({ id });
      if (!result.ok) return result;
      return ok(await hydration.hydrateContent(result.data.resource));
    },
    updateResource: async (id, data) => {
      return mutation.updateResource(id, data);
    },
    moveResource: async (id, targetFolderId) => {
      return mutation.moveResource(id, targetFolderId);
    },
    deleteResource: async (id) => {
      return mutation.deleteResource(id);
    },
    uploadResources: async (data, ctx) => {
      return useCases.uploadResources.execute({
        repositoryId: data.repositoryId,
        identityId: ctx.identityId,
        files: data.files as any,
        metadata: data.metadata as UploadResourcesRequestDTO | undefined,
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
        bookmarkId: bookmarkId as BookmarkId,
        aliasName: data.aliasName,
        icon: data.icon,
        color: data.color,
      });
    },
    reorderResourceBookmarks: async (repositoryId, data, ctx) => {
      return useCases.reorderResourceBookmarks.execute({
        repositoryId,
        identityId: ctx.identityId,
        bookmarkIds: data.bookmarkIds.map((bookmarkId) => bookmarkId as BookmarkId),
      });
    },
    deleteResourceBookmark: async (repositoryId, bookmarkId, ctx) => {
      return useCases.deleteResourceBookmark.execute({
        repositoryId,
        identityId: ctx.identityId,
        bookmarkId: bookmarkId as BookmarkId,
      });
    },

    // ---- Repository resolution — 仓库解析 ----
    findActiveRepository: async (identityId) => {
      return repositoryResolution.ensureCanonicalRepository(identityId);
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
