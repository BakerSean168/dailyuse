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
  CreateRepository,
  GetRepository,
  ListRepositories,
  UpdateRepositoryConfig,
  UpdateRepositoryStats,
  DeleteRepository,
  ArchiveRepository,
  ActivateRepository,
  GetResource,
  ListResources,
  CreateResource,
  UpdateResourceContent,
  UploadResources,
  CreateFolder,
  GetFolder,
  GetFolderTree,
  RenameFolder,
  MoveFolder,
  DeleteFolder,
  CreateResourceBookmark,
  UpdateResourceBookmark,
  ReorderResourceBookmarks,
  DeleteResourceBookmark,
  ListResourceBookmarks,
  DeleteResource,
} from '../application-server';
import { ok, fail } from '@dailyuse/contracts/result';
import type { Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import { RepositoryStatus } from '@dailyuse/contracts/repository';

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
  readonly createRepository: CreateRepository;
  readonly getRepository: GetRepository;
  readonly listRepositories: ListRepositories;
  readonly updateRepositoryConfig: UpdateRepositoryConfig;
  readonly updateRepositoryStats: UpdateRepositoryStats;
  readonly deleteRepository: DeleteRepository;
  readonly archiveRepository: ArchiveRepository;
  readonly activateRepository: ActivateRepository;
  readonly getResource: GetResource;
  readonly listResources: ListResources;
  readonly createResource: CreateResource;
  readonly updateResourceContent: UpdateResourceContent;
  readonly uploadResources: UploadResources;
  readonly deleteResource: DeleteResource;
  readonly createFolder: CreateFolder;
  readonly getFolder: GetFolder;
  readonly getFolderTree: GetFolderTree;
  readonly renameFolder: RenameFolder;
  readonly moveFolder: MoveFolder;
  readonly deleteFolder: DeleteFolder;
  readonly createResourceBookmark: CreateResourceBookmark;
  readonly updateResourceBookmark: UpdateResourceBookmark;
  readonly reorderResourceBookmarks: ReorderResourceBookmarks;
  readonly deleteResourceBookmark: DeleteResourceBookmark;
  readonly listResourceBookmarks: ListResourceBookmarks;
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
  // Repository CRUD — 仓库增删改查
  createRepository(
    data: {
      name: string;
      type: string;
      path?: string;
      description?: string;
      config?: Record<string, unknown>;
    },
    ctx: Context,
  ): Promise<Result<unknown>>;
  listRepositories(
    filters: { status?: string; type?: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  getCurrentRepository(ctx: Context): Promise<Result<unknown>>;
  getRepository(id: string): Promise<Result<unknown>>;
  updateRepository(
    id: string,
    data: { config?: Record<string, unknown> },
  ): Promise<Result<unknown>>;
  deleteRepository(id: string): Promise<Result<unknown>>;
  archiveRepository(id: string): Promise<Result<unknown>>;
  activateRepository(id: string): Promise<Result<unknown>>;

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

  const createResource = new CreateResource(resourceRepository, repositoryRepository, storagePort);
  const updateResourceContent = new UpdateResourceContent(
    resourceRepository,
    repositoryRepository,
    storagePort,
  );

  return {
    createRepository: new CreateRepository(repositoryRepository),
    getRepository: new GetRepository(repositoryRepository),
    listRepositories: new ListRepositories(repositoryRepository),
    updateRepositoryConfig: new UpdateRepositoryConfig(repositoryRepository),
    updateRepositoryStats: new UpdateRepositoryStats(repositoryRepository),
    deleteRepository: new DeleteRepository(repositoryRepository),
    archiveRepository: new ArchiveRepository(repositoryRepository),
    activateRepository: new ActivateRepository(repositoryRepository),
    getResource: new GetResource(resourceRepository),
    listResources: new ListResources(resourceRepository),
    createResource,
    updateResourceContent,
    uploadResources: new UploadResources(
      createResource,
      resourceRepository,
      repositoryRepository,
      folderRepository,
    ),
    deleteResource: new DeleteResource(resourceRepository, repositoryRepository, storagePort),
    createFolder: new CreateFolder(folderRepository, repositoryRepository, storagePort),
    getFolder: new GetFolder(folderRepository),
    getFolderTree: new GetFolderTree(folderRepository),
    renameFolder: new RenameFolder(
      folderRepository,
      resourceRepository,
      repositoryRepository,
      storagePort,
    ),
    moveFolder: new MoveFolder(
      folderRepository,
      resourceRepository,
      repositoryRepository,
      storagePort,
    ),
    deleteFolder: new DeleteFolder(
      folderRepository,
      resourceRepository,
      repositoryRepository,
      storagePort,
    ),
    createResourceBookmark: new CreateResourceBookmark(
      resourceBookmarkRepository,
      resourceRepository,
    ),
    updateResourceBookmark: new UpdateResourceBookmark(
      resourceBookmarkRepository,
      resourceRepository,
    ),
    reorderResourceBookmarks: new ReorderResourceBookmarks(
      resourceBookmarkRepository,
      resourceRepository,
    ),
    deleteResourceBookmark: new DeleteResourceBookmark(resourceBookmarkRepository),
    listResourceBookmarks: new ListResourceBookmarks(
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
 * This is where use-case `.execute()` calls are mapped to the `RepositoryApplicationPort`
 * signatures. All business logic wiring (ok/fail wrapping, DTO transforms) lives here
 * so that transports remain thin boring mapping.
 *
 * 所有业务逻辑接线（ok/fail 包装、DTO 转换）都在这里完成，
 * 以确保传输层保持简单无聊的映射。
 */
function buildApplicationPort(
  useCases: RepositoryModuleUseCases,
  deps: RepositoryModuleDependencies,
): RepositoryApplicationPort {
  const { resourceRepository } = deps;

  return {
    // ---- Repository CRUD — 仓库增删改查 ----
    createRepository: async (data, ctx) => {
      const result = await useCases.createRepository.execute({
        identityId: ctx.identityId,
        name: data.name,
        type: data.type as any,
        path: data.path ?? data.name,
        description: data.description,
        config: data.config as any,
      });
      return ok(result.repository);
    },
    listRepositories: async (filters, ctx) => {
      const result = await useCases.listRepositories.execute({
        identityId: ctx.identityId,
        status: filters.status as any,
      });
      return ok(result.repositories);
    },
    getCurrentRepository: async (ctx) => {
      const result = await useCases.listRepositories.execute({
        identityId: ctx.identityId,
      });
      const repositories = result.repositories;

      if (repositories.length === 0) {
        return ok(null);
      }

      if (repositories.length > 1) {
        return fail({
          code: 'CONFLICT',
          message: 'Single-repository mode expected exactly one repository',
          context: {
            count: repositories.length,
            repositoryIds: repositories.map((repository) => repository.id),
          },
        });
      }

      return ok(repositories[0]);
    },
    getRepository: async (id) => {
      const result = await useCases.getRepository.execute({ id });
      return ok(result.repository);
    },
    updateRepository: async (id, data) => {
      const result = await useCases.updateRepositoryConfig.execute({
        id,
        config: data.config ?? {},
      });
      return ok(result.repository);
    },
    deleteRepository: async (id) => {
      await useCases.deleteRepository.execute({ id });
      return ok(undefined);
    },
    archiveRepository: async (id) => {
      const result = await useCases.archiveRepository.execute({ id });
      return ok(result.repository);
    },
    activateRepository: async (id) => {
      const result = await useCases.activateRepository.execute({ id });
      return ok(result.repository);
    },

    // ---- Resource CRUD — 资源增删改查 ----
    createResource: async (data, ctx) => {
      const result = await useCases.createResource.execute({
        repositoryId: data.repositoryId,
        identityId: ctx.identityId || 'api-user',
        folderId: data.folderId,
        name: data.name,
        type: data.type as any,
        path: data.path ?? `/${data.name}`,
        content: data.content,
      });
      return ok(result.resource);
    },
    listResources: async (repositoryId) => {
      const result = await useCases.listResources.execute({ repositoryId });
      return ok(result.resources);
    },
    getResource: async (id) => {
      const result = await useCases.getResource.execute({ id });
      return ok(result.resource);
    },
    updateResource: async (id, data) => {
      const currentResource = await resourceRepository.findById(id);
      if (!currentResource) {
        throw new Error(`Resource not found: ${id}`);
      }

      if (data.name !== undefined) {
        currentResource.rename(data.name);
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
        return ok(result.resource);
      }

      return ok(currentResource.toClientDTO());
    },
    deleteResource: async (id) => {
      const resource = await resourceRepository.findById(id);
      if (!resource) throw new Error(`Resource not found: ${id}`);
      resource.delete();
      await resourceRepository.save(resource);
      return ok(undefined);
    },
    uploadResources: async (data, ctx) => {
      const result = await useCases.uploadResources.execute({
        repositoryId: data.repositoryId,
        identityId: ctx.identityId || 'api-user',
        files: data.files as any,
        metadata: data.metadata as any,
      });
      return ok(result);
    },

    // ---- Repository stats — 仓库统计 ----
    updateRepositoryStats: async (id, data) => {
      const result = await useCases.updateRepositoryStats.execute({ id, stats: data as any });
      return ok(result.repository);
    },

    // ---- Folder CRUD — 文件夹增删改查 ----
    createFolder: async (data, ctx) => {
      const result = await useCases.createFolder.execute({
        repositoryId: data.repositoryId,
        identityId: ctx.identityId,
        name: data.name,
        parentId: data.parentId,
        order: data.order,
      });
      return ok(result.folder);
    },
    getFolderTree: async (repositoryId) => {
      const result = await useCases.getFolderTree.execute({ repositoryId });
      return ok(result.folders);
    },
    getFolder: async (id) => {
      const result = await useCases.getFolder.execute({ id });
      if (!result.folder) return fail({ code: 'NOT_FOUND', message: `Folder not found: ${id}` });
      return ok(result.folder);
    },
    renameFolder: async (id, newName) => {
      const result = await useCases.renameFolder.execute({ id, newName });
      return ok(result.folder);
    },
    moveFolder: async (id, newParentId) => {
      const result = await useCases.moveFolder.execute({ id, newParentId });
      return ok(result.folder);
    },
    deleteFolder: async (id) => {
      await useCases.deleteFolder.execute({ id });
      return ok(undefined);
    },

    // ---- Bookmark CRUD — 书签增删改查 ----
    listResourceBookmarks: async (repositoryId, ctx) => {
      const result = await useCases.listResourceBookmarks.execute({
        repositoryId,
        identityId: ctx.identityId,
      });
      return ok(result.bookmarks);
    },
    createResourceBookmark: async (repositoryId, data, ctx) => {
      const result = await useCases.createResourceBookmark.execute({
        repositoryId,
        identityId: ctx.identityId,
        resourceId: data.resourceId,
        aliasName: data.aliasName,
        icon: data.icon,
        color: data.color,
      });
      return ok(result.bookmark);
    },
    updateResourceBookmark: async (repositoryId, bookmarkId, data, ctx) => {
      const result = await useCases.updateResourceBookmark.execute({
        repositoryId,
        identityId: ctx.identityId,
        bookmarkId,
        aliasName: data.aliasName,
        icon: data.icon,
        color: data.color,
      });
      return ok(result.bookmark);
    },
    reorderResourceBookmarks: async (repositoryId, data, ctx) => {
      const result = await useCases.reorderResourceBookmarks.execute({
        repositoryId,
        identityId: ctx.identityId,
        bookmarkIds: data.bookmarkIds,
      });
      return ok(result.bookmarks);
    },
    deleteResourceBookmark: async (repositoryId, bookmarkId, ctx) => {
      await useCases.deleteResourceBookmark.execute({
        repositoryId,
        identityId: ctx.identityId,
        bookmarkId,
      });
      return ok({ ok: true });
    },

    // ---- Repository resolution — 仓库解析 ----
    findActiveRepository: async (identityId) => {
      // Try active repositories first, fall back to any repository owned by the identity.
      // 优先查找活跃仓库，回退到该身份拥有的任何仓库。
      const { repositoryRepository } = deps;
      const activeRepos = await repositoryRepository.findByIdentityIdAndStatus(
        identityId,
        RepositoryStatus.Active,
      );
      const repository =
        activeRepos[0] ?? (await repositoryRepository.findByIdentityId(identityId))[0];

      if (!repository) {
        return fail({
          code: 'NOT_FOUND',
          message: `No repository available for identity: ${identityId}`,
        });
      }
      return ok(repository);
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
