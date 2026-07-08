/**
 * Repository Electron seam.
 *
 * Owns desktop-main registration for the repository runtime.
 */
import { ipcMain } from 'electron';
import * as path from 'path';
import { app } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import type { SearchResponse } from '@dailyuse/contracts/repository';
import { createLogger } from '@dailyuse/utils/logger';
import {
  createFsStorageAdapter,
  createRepositoryPowerSyncModule,
  type RepositoryModuleInstance,
} from '../server/infrastructure';
import { createRepositoryRuntimeContribution } from '../server/infrastructure/runtime';
import { withAuthenticatedValue } from './authenticated-ipc';

export {
  createFsStorageAdapter,
  createRepositoryPowerSyncModule,
  type CreateRepositoryPowerSyncModuleOptions,
  type RepositoryModuleInstance,
} from '../server/infrastructure';

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
      const storageBaseDir =
        options.storageBaseDir ?? path.join(app.getPath('userData'), 'repository-storage');
      const storagePort = createFsStorageAdapter(storageBaseDir);
      const repositoryModule = createRepositoryPowerSyncModule(ctx.db, {
        storagePort,
        runtimeContributions: createRepositoryRuntimeContribution(),
      });
      activeRepositoryModule = repositoryModule;
      repositoryModule.start();

      const { api } = repositoryModule;

      ipcMain.handle(Ch.CURRENT, (_, _params) =>
        withAuthenticatedValue(ctx, async (requestContext) => {
          const result = await api.getCurrentRepository(requestContext);
          return result.ok ? result.data : null;
        }),
      );

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
        if (dto.name !== undefined) {
          const result = await api.renameFolder(dto.id, dto.name);
          return result.ok ? result.data : null;
        }
        if (dto.parentId !== undefined) {
          const result = await api.moveFolder(dto.id, dto.parentId);
          return result.ok ? result.data : null;
        }
        const result = await api.getFolder(dto.id);
        return result.ok ? result.data : null;
      });
      ipcMain.handle(Ch.FOLDER_DELETE, async (_, id) => {
        await api.deleteFolder(id);
        return undefined;
      });

      ipcMain.handle(Ch.SEARCH, async (_, request) => {
        const startedAt = Date.now();
        const query = typeof request?.query === 'string' ? request.query.trim() : '';
        const repositoryId = typeof request?.repositoryId === 'string' ? request.repositoryId : '';

        if (!query || !repositoryId) {
          return {
            results: [],
            totalResults: 0,
            totalMatches: 0,
            searchTime: Date.now() - startedAt,
            query,
            mode: request?.mode ?? 'all',
          } satisfies SearchResponse;
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

        return {
          results,
          totalResults: results.length,
          totalMatches: results.reduce((sum, item) => sum + item.matchCount, 0),
          searchTime: Date.now() - startedAt,
          query,
          mode: request?.mode ?? 'all',
        } satisfies SearchResponse;
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
