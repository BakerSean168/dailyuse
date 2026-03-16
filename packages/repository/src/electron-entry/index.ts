/**
 * Repository Module — Electron Entry Point.
 * 仓库模块 — Electron 入口点。
 *
 * Self-contained repository runtime assembly for Electron main process.
 * 仓库模块在 Electron 主进程中的自包含运行时组装。
 *
 * Uses the same composition root as the API module (createRepositoryPowerSyncModule),
 * and registers IPC handlers that delegate to the module's assembled use cases.
 *
 * 使用与 API 模块相同的组合根（createRepositoryPowerSyncModule），
 * 并注册 IPC 处理器来委托给模块组装好的用例。
 *
 * @module repository/electron-entry
 */

import { ipcMain } from 'electron';
import * as path from 'path';
import { app } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { createRepositoryPowerSyncModule } from '../infrastructure-server/powersync';
import { FsStorageAdapter } from '../infrastructure-server/adapters/fs/fs-storage.adapter';
import type { RepositoryModuleInstance } from '../infrastructure-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositoryElectron');

const Ch = {
  LIST: 'repository:list',
  CURRENT: 'repository:current',
  GET: 'repository:get',
  CREATE: 'repository:create',
  UPDATE: 'repository:update',
  DELETE: 'repository:delete',
  RESOURCE_LIST: 'repository:resource:list',
  RESOURCE_GET: 'repository:resource:get',
  RESOURCE_CREATE: 'repository:resource:create',
  RESOURCE_UPLOAD: 'repository:resource:upload',
  RESOURCE_UPDATE: 'repository:resource:update',
  RESOURCE_DELETE: 'repository:resource:delete',
  BOOKMARK_LIST: 'repository:bookmark:list',
  BOOKMARK_CREATE: 'repository:bookmark:create',
  BOOKMARK_UPDATE: 'repository:bookmark:update',
  BOOKMARK_REORDER: 'repository:bookmark:reorder',
  BOOKMARK_DELETE: 'repository:bookmark:delete',
  FOLDER_LIST: 'repository:folder:list',
  FOLDER_CREATE: 'repository:folder:create',
  FOLDER_UPDATE: 'repository:folder:update',
  FOLDER_DELETE: 'repository:folder:delete',
  SEARCH: 'repository:search',
} as const;

const channels = Object.values(Ch);

/**
 * Resolve identity ID from IPC params.
 * 从 IPC 参数中解析身份 ID。
 */
function resolveIdentityId(params: unknown): string {
  if (
    params &&
    typeof params === 'object' &&
    'identityId' in params &&
    typeof (params as { identityId?: unknown }).identityId === 'string' &&
    (params as { identityId: string }).identityId.length > 0
  ) {
    return (params as { identityId: string }).identityId;
  }

  if (typeof params === 'string' && params.length > 0) {
    return params;
  }

  return 'local-user';
}

let activeRepositoryModule: RepositoryModuleInstance | null = null;

export const RepositoryElectronModule: IElectronModule = {
  name: 'Repository',

  register(ctx: IElectronModuleContext): void {
    // 1. Composition Root — same factory as API, different adapters
    //    组合根 — 与 API 相同的工厂，不同的适配器
    const storageBaseDir = path.join(app.getPath('userData'), 'repository-storage');
    const storagePort = new FsStorageAdapter(storageBaseDir);

    const repositoryModule = createRepositoryPowerSyncModule(ctx.db, { storagePort });
    activeRepositoryModule = repositoryModule;
    repositoryModule.start();

    // 2. Extract the application port — transport-neutral facade
    //    提取应用层门面 — 传输层无关的门面
    //
    //    All IPC handlers route through `api` instead of raw repositories or
    //    use cases. This keeps the transport layer thin and ensures business
    //    rules are enforced consistently.
    //    所有 IPC 处理器通过 `api` 路由，而非直接访问仓储或用例，
    //    以保持传输层精简并确保业务规则的一致性。
    const { api } = repositoryModule;

    // 3. IPC Handlers — thin transport mapping via api facade
    //    IPC 处理器 — 通过 api 门面进行精简的传输层映射

    /**
     * Build a Context from IPC params for methods that require it.
     * 从 IPC 参数构建 Context，用于需要上下文的方法。
     *
     * In Electron (local-only), deviceId defaults to 'local-device'.
     * 在 Electron（本地模式）中，deviceId 默认为 'local-device'。
     */
    const buildCtx = (params: unknown): import('@dailyuse/contracts/shared').Context => ({
      identityId: resolveIdentityId(params),
      deviceId:
        params && typeof params === 'object' && 'deviceId' in params
          ? String((params as Record<string, unknown>).deviceId)
          : 'local-device',
    });

    // Repository CRUD / 仓库增删改查
    ipcMain.handle(Ch.LIST, async (_, params) => {
      const result = await api.listRepositories({}, buildCtx(params));
      return result.ok ? result.data : [];
    });
    ipcMain.handle(Ch.CURRENT, async (_, params) => {
      const result = await api.getCurrentRepository(buildCtx(params));
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.GET, async (_, id) => {
      const result = await api.getRepository(id);
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.CREATE, async (_, dto) => {
      const result = await api.createRepository(
        {
          name: dto.name,
          type: dto.type,
          path: dto.path,
          description: dto.description,
          config: dto.config,
        },
        buildCtx(dto),
      );
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.UPDATE, async (_, dto) => {
      const result = await api.updateRepository(dto.id, { config: dto.config });
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.DELETE, async (_, id) => {
      await api.deleteRepository(id);
      return undefined;
    });

    // Resource CRUD / 资源增删改查
    ipcMain.handle(Ch.RESOURCE_LIST, async (_, params) => {
      const repositoryId = params?.repositoryId ?? params;
      const result = await api.listResources(repositoryId);
      return result.ok ? result.data : [];
    });
    ipcMain.handle(Ch.RESOURCE_GET, async (_, id) => {
      const result = await api.getResource(id);
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.RESOURCE_CREATE, async (_, dto) => {
      const result = await api.createResource(
        {
          repositoryId: dto.repositoryId,
          folderId: dto.folderId,
          name: dto.name,
          type: dto.type,
          content: dto.content,
        },
        buildCtx(dto),
      );
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.RESOURCE_UPLOAD, async (_, payload) => {
      const result = await api.uploadResources(
        {
          repositoryId: payload.repositoryId,
          files: payload.files,
          metadata: payload.metadata,
        },
        buildCtx(payload),
      );
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.RESOURCE_UPDATE, async (_, dto) => {
      const result = await api.updateResource(dto.id, {
        name: dto.name,
        metadata: dto.metadata,
        content: dto.content,
      });
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.RESOURCE_DELETE, async (_, id) => {
      await api.deleteResource(id);
      return undefined;
    });

    // Bookmark CRUD / 书签增删改查
    ipcMain.handle(Ch.BOOKMARK_LIST, async (_, params) => {
      const result = await api.listResourceBookmarks(params.repositoryId, buildCtx(params));
      return result.ok ? result.data : [];
    });
    ipcMain.handle(Ch.BOOKMARK_CREATE, async (_, payload) => {
      const result = await api.createResourceBookmark(
        payload.repositoryId,
        {
          resourceId: payload.request.resourceId,
          aliasName: payload.request.aliasName,
          icon: payload.request.icon,
          color: payload.request.color,
        },
        buildCtx(payload),
      );
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.BOOKMARK_UPDATE, async (_, payload) => {
      const result = await api.updateResourceBookmark(
        payload.repositoryId,
        payload.bookmarkId,
        {
          aliasName: payload.request.aliasName,
          icon: payload.request.icon,
          color: payload.request.color,
        },
        buildCtx(payload),
      );
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.BOOKMARK_REORDER, async (_, payload) => {
      const result = await api.reorderResourceBookmarks(
        payload.repositoryId,
        { bookmarkIds: payload.request.bookmarkIds },
        buildCtx(payload),
      );
      return result.ok ? result.data : [];
    });
    ipcMain.handle(Ch.BOOKMARK_DELETE, async (_, payload) => {
      await api.deleteResourceBookmark(payload.repositoryId, payload.bookmarkId, buildCtx(payload));
      return undefined;
    });

    // Folder CRUD / 文件夹增删改查
    ipcMain.handle(Ch.FOLDER_LIST, async (_, params) => {
      const repositoryId = params?.repositoryId ?? params;
      const result = await api.getFolderTree(repositoryId);
      return result.ok ? result.data : [];
    });
    ipcMain.handle(Ch.FOLDER_CREATE, async (_, dto) => {
      const result = await api.createFolder(
        {
          repositoryId: dto.repositoryId,
          name: dto.name,
          parentId: dto.parentId,
          order: dto.order,
        },
        buildCtx(dto),
      );
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.FOLDER_UPDATE, async (_, dto) => {
      // Folder update maps to rename or move via the application port.
      // 文件夹更新通过应用层门面映射为重命名或移动操作。
      if (dto.name !== undefined) {
        const result = await api.renameFolder(dto.id, dto.name);
        return result.ok ? result.data : null;
      }
      if (dto.parentId !== undefined) {
        const result = await api.moveFolder(dto.id, dto.parentId);
        return result.ok ? result.data : null;
      }
      // No-op if nothing to update — 无需更新时返回当前状态
      const result = await api.getFolder(dto.id);
      return result.ok ? result.data : null;
    });
    ipcMain.handle(Ch.FOLDER_DELETE, async (_, id) => {
      await api.deleteFolder(id);
      return undefined;
    });

    // Search / 搜索
    ipcMain.handle(Ch.SEARCH, async () => []);

    logger.info('Repository module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    activeRepositoryModule?.dispose();
    activeRepositoryModule = null;
    logger.info('Repository module destroyed');
  },
};
