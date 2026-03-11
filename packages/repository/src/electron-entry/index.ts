/**
 * Repository Module — Electron Entry Point
 *
 * @module repository/electron-entry
 */

import { ipcMain } from 'electron';
import * as path from 'path';
import { app } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { RepositoryPowerSyncModule, RepositoryContainer } from '../infrastructure-server/powersync';
import { FsStorageAdapter } from '../infrastructure-server/adapters/fs/fs-storage.adapter';
import {
  CreateResource,
  UpdateResourceContent,
  UploadResources,
  ListResourceBookmarks,
  CreateResourceBookmark,
  UpdateResourceBookmark,
  ReorderResourceBookmarks,
  DeleteResourceBookmark,
} from '../application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositoryElectron');

const Ch = {
  LIST: 'repository:list',
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

export const RepositoryElectronModule: IElectronModule = {
  name: 'Repository',

  register(ctx: IElectronModuleContext): void {
    const mod = new RepositoryPowerSyncModule(ctx.db);

    const repoRepo = mod.repositoryRepository;
    const resourceRepo = mod.resourceRepository;
    const folderRepo = mod.folderRepository;

    const storageBaseDir = path.join(app.getPath('userData'), 'repository-storage');
    const storagePort = new FsStorageAdapter(storageBaseDir);

    const createResource = new CreateResource(resourceRepo, repoRepo, storagePort);
    const updateResourceContent = new UpdateResourceContent(resourceRepo, repoRepo, storagePort);

    // Repository CRUD
    ipcMain.handle(Ch.LIST, (_, params) => repoRepo.findByIdentityId(params?.identityId ?? params));
    ipcMain.handle(Ch.GET, (_, id) => repoRepo.findById(id));
    ipcMain.handle(Ch.CREATE, (_, dto) => repoRepo.save(dto));
    ipcMain.handle(Ch.UPDATE, (_, dto) => repoRepo.save(dto));
    ipcMain.handle(Ch.DELETE, (_, id) => repoRepo.delete(id));

    // Resource CRUD
    ipcMain.handle(Ch.RESOURCE_LIST, (_, params) =>
      resourceRepo.findByRepositoryId(params?.repositoryId ?? params),
    );
    ipcMain.handle(Ch.RESOURCE_GET, (_, id) => resourceRepo.findById(id));
    ipcMain.handle(Ch.RESOURCE_CREATE, async (_, dto) => {
      const result = await createResource.execute({
        repositoryId: dto.repositoryId,
        identityId: dto.identityId || 'local-user', // Electron default
        folderId: dto.folderId,
        name: dto.name,
        type: dto.type as any,
        path: dto.path || `/${dto.name}`,
        content: dto.content,
      });
      return result.resource;
    });
    const uploadResources = new UploadResources(createResource, resourceRepo, repoRepo, folderRepo);
    const listBookmarks = new ListResourceBookmarks(mod.resourceBookmarkRepository, resourceRepo);
    const createBookmark = new CreateResourceBookmark(mod.resourceBookmarkRepository, resourceRepo);
    const updateBookmark = new UpdateResourceBookmark(mod.resourceBookmarkRepository, resourceRepo);
    const reorderBookmarks = new ReorderResourceBookmarks(
      mod.resourceBookmarkRepository,
      resourceRepo,
    );
    const deleteBookmark = new DeleteResourceBookmark(mod.resourceBookmarkRepository);
    ipcMain.handle(Ch.RESOURCE_UPLOAD, async (_, payload) => {
      return uploadResources.execute({
        repositoryId: payload.repositoryId,
        identityId: payload.identityId || 'local-user',
        files: payload.files,
        metadata: payload.metadata,
      });
    });
    ipcMain.handle(Ch.RESOURCE_UPDATE, async (_, dto) => {
      if (dto.content !== undefined) {
        const result = await updateResourceContent.execute({
          id: dto.id,
          content: dto.content,
        });
        return result.resource;
      }
      return resourceRepo.save(dto);
    });
    ipcMain.handle(Ch.RESOURCE_DELETE, (_, id) => resourceRepo.delete(id));
    ipcMain.handle(Ch.BOOKMARK_LIST, async (_, params) => {
      const result = await listBookmarks.execute({
        repositoryId: params.repositoryId,
        identityId: params.identityId || 'local-user',
      });
      return result.bookmarks;
    });
    ipcMain.handle(Ch.BOOKMARK_CREATE, async (_, payload) => {
      const result = await createBookmark.execute({
        repositoryId: payload.repositoryId,
        identityId: payload.identityId || 'local-user',
        resourceId: payload.request.resourceId,
        aliasName: payload.request.aliasName,
        icon: payload.request.icon,
        color: payload.request.color,
      });
      return result.bookmark;
    });
    ipcMain.handle(Ch.BOOKMARK_UPDATE, async (_, payload) => {
      const result = await updateBookmark.execute({
        repositoryId: payload.repositoryId,
        identityId: payload.identityId || 'local-user',
        bookmarkId: payload.bookmarkId,
        aliasName: payload.request.aliasName,
        icon: payload.request.icon,
        color: payload.request.color,
      });
      return result.bookmark;
    });
    ipcMain.handle(Ch.BOOKMARK_REORDER, async (_, payload) => {
      const result = await reorderBookmarks.execute({
        repositoryId: payload.repositoryId,
        identityId: payload.identityId || 'local-user',
        bookmarkIds: payload.request.bookmarkIds,
      });
      return result.bookmarks;
    });
    ipcMain.handle(Ch.BOOKMARK_DELETE, async (_, payload) => {
      await deleteBookmark.execute({
        repositoryId: payload.repositoryId,
        identityId: payload.identityId || 'local-user',
        bookmarkId: payload.bookmarkId,
      });
      return undefined;
    });

    // Folder CRUD
    ipcMain.handle(Ch.FOLDER_LIST, (_, params) =>
      folderRepo.findByRepositoryId(params?.repositoryId ?? params),
    );
    ipcMain.handle(Ch.FOLDER_CREATE, (_, dto) => folderRepo.save(dto));
    ipcMain.handle(Ch.FOLDER_UPDATE, (_, dto) => folderRepo.save(dto));
    ipcMain.handle(Ch.FOLDER_DELETE, (_, id) => folderRepo.delete(id));

    // Search
    ipcMain.handle(Ch.SEARCH, async () => []);

    logger.info('Repository module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    RepositoryContainer.getInstance().reset();
    logger.info('Repository module destroyed');
  },
};
