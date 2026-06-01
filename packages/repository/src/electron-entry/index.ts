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
import { createLogger } from '@dailyuse/utils/logger';
import type { SearchResponse } from '@dailyuse/contracts/repository';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('RepositoryElectron');

const Ch = {
  CURRENT: 'repository:current',
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

let activeRepositoryModule: RepositoryModuleInstance | null = null;

export interface RepositoryElectronModuleOptions {
  storageBaseDir?: string;
}

export function createRepositoryElectronModule(
  options: RepositoryElectronModuleOptions = {},
): IElectronModule {
  return {
    name: 'Repository',

    register(ctx: IElectronModuleContext): void {
      // 1. Composition Root — same factory as API, different adapters
      //    组合根 — 与 API 相同的工厂，不同的适配器
      const storageBaseDir =
        options.storageBaseDir ?? path.join(app.getPath('userData'), 'repository-storage');
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

    // Current repository / 当前仓库
    ipcMain.handle(Ch.CURRENT, (_, _params) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await api.getCurrentRepository(requestContext);
        return result.ok ? result.data : null;
      }),
    );

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
    ipcMain.handle(Ch.RESOURCE_CREATE, (_, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        return api.createResource(
          {
            repositoryId: dto.repositoryId,
            folderId: dto.folderId,
            name: dto.name,
            type: dto.type,
            content: dto.content,
          },
          requestContext,
        );
      }),
    );
    ipcMain.handle(Ch.RESOURCE_UPLOAD, (_, payload) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await api.uploadResources(
          {
            repositoryId: payload.repositoryId,
            files: payload.files,
            metadata: payload.metadata,
          },
          requestContext,
        );
        return result.ok ? result.data : null;
      }),
    );
    ipcMain.handle(Ch.RESOURCE_UPDATE, async (_, dto) => {
      // Resource move takes priority — delegate to moveResource if targetFolderId is present.
      // 资源移动优先 — 若存在 targetFolderId，委托给 moveResource。
      if (dto.targetFolderId !== undefined) {
        const result = await api.moveResource(dto.id, dto.targetFolderId);
        return result.ok ? result.data : null;
      }
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
    ipcMain.handle(Ch.BOOKMARK_LIST, (_, params) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await api.listResourceBookmarks(params.repositoryId, requestContext);
        return result.ok ? result.data : [];
      }),
    );
    ipcMain.handle(Ch.BOOKMARK_CREATE, (_, payload) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await api.createResourceBookmark(
          payload.repositoryId,
          {
            resourceId: payload.request.resourceId,
            aliasName: payload.request.aliasName,
            icon: payload.request.icon,
            color: payload.request.color,
          },
          requestContext,
        );
        return result.ok ? result.data : null;
      }),
    );
    ipcMain.handle(Ch.BOOKMARK_UPDATE, (_, payload) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await api.updateResourceBookmark(
          payload.repositoryId,
          payload.bookmarkId,
          {
            aliasName: payload.request.aliasName,
            icon: payload.request.icon,
            color: payload.request.color,
          },
          requestContext,
        );
        return result.ok ? result.data : null;
      }),
    );
    ipcMain.handle(Ch.BOOKMARK_REORDER, (_, payload) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await api.reorderResourceBookmarks(
          payload.repositoryId,
          { bookmarkIds: payload.request.bookmarkIds },
          requestContext,
        );
        return result.ok ? result.data : [];
      }),
    );
    ipcMain.handle(Ch.BOOKMARK_DELETE, (_, payload) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        await api.deleteResourceBookmark(payload.repositoryId, payload.bookmarkId, requestContext);
        return undefined;
      }),
    );

    // Folder CRUD / 文件夹增删改查
    ipcMain.handle(Ch.FOLDER_LIST, async (_, params) => {
      if (params && typeof params === 'object' && 'folderId' in params) {
        const folderId = String((params as { folderId: unknown }).folderId);
        const folder = await repositoryModule.folderRepository.findById(folderId);
        if (!folder) {
          return { folders: [], resources: [] };
        }

        const [folders, resources] = await Promise.all([
          repositoryModule.folderRepository.findByParentId(folderId),
          repositoryModule.resourceRepository.findByFolderId(folderId),
        ]);

        return {
          folders: folders.map((item) => item.toClientDTO()),
          resources: resources.map((item) => item.toClientDTO()),
        };
      }

      const repositoryId =
        params && typeof params === 'object' && 'repositoryId' in params
          ? String((params as { repositoryId: unknown }).repositoryId)
          : String(params);
      const result = await api.getFolderTree(repositoryId);
      return result.ok ? result.data : [];
    });
    ipcMain.handle(Ch.FOLDER_CREATE, (_, dto) =>
      withAuthenticatedValue(ctx, async (requestContext) => {
        const result = await api.createFolder(
          {
            repositoryId: dto.repositoryId,
            name: dto.name,
            parentId: dto.parentId,
            order: dto.order,
          },
          requestContext,
        );
        return result.ok ? result.data : null;
      }),
    );
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
    ipcMain.handle(Ch.SEARCH, async (_, request) => {
      const startedAt = Date.now();
      const query = typeof request?.query === 'string' ? request.query.trim() : '';
      const repositoryId = typeof request?.repositoryId === 'string' ? request.repositoryId : '';

      if (!query || !repositoryId) {
        const empty: SearchResponse = {
          results: [],
          totalResults: 0,
          totalMatches: 0,
          searchTime: Date.now() - startedAt,
          query,
          mode: request?.mode ?? 'all',
        };
        return empty;
      }

      const resources = await repositoryModule.resourceRepository.findByRepositoryId(repositoryId);
      const normalizedQuery = request?.caseSensitive ? query : query.toLowerCase();
      const results = resources
        .map((resource) => {
          const dto = resource.toClientDTO();
          const haystacks = [dto.name, dto.path, dto.content ?? ''];
          const matches = haystacks.flatMap((value, index) => {
            const source = request?.caseSensitive ? value : value.toLowerCase();
            const matchIndex = source.indexOf(normalizedQuery);
            if (matchIndex < 0) return [];

            return [
              {
                lineNumber: index + 1,
                lineContent: value,
                startIndex: matchIndex,
                endIndex: matchIndex + query.length,
              },
            ];
          });

          if (matches.length === 0) {
            return null;
          }

          return {
            resourceId: dto.id,
            resourceName: dto.name,
            resourcePath: dto.path,
            resourceType: dto.type,
            matchType: (dto.name.toLowerCase().includes(normalizedQuery.toLowerCase())
              ? 'filename'
              : 'content') as SearchResponse['results'][number]['matchType'],
            matches,
            matchCount: matches.length,
            createdAt: new Date(dto.createdAt).toISOString(),
            updatedAt: new Date(dto.updatedAt).toISOString(),
            size: dto.size,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const response: SearchResponse = {
        results,
        totalResults: results.length,
        totalMatches: results.reduce((sum, item) => sum + item.matchCount, 0),
        searchTime: Date.now() - startedAt,
        query,
        mode: request?.mode ?? 'all',
      };

      return response;
    });

      logger.info('Repository module registered', { storageBaseDir });
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
}

export const RepositoryElectronModule: IElectronModule = createRepositoryElectronModule();
