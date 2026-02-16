/**
 * Repository Module — Electron Entry Point
 *
 * @module repository/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import { RepositoryModule } from '../infrastructure-server';
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
  RESOURCE_UPDATE: 'repository:resource:update',
  RESOURCE_DELETE: 'repository:resource:delete',
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
    const mod = new RepositoryModule('sqlite', ctx.db);

    const repoRepo = mod.repositoryRepository;
    const resourceRepo = mod.resourceRepository;
    const folderRepo = mod.folderRepository;

    // Repository CRUD
    ipcMain.handle(Ch.LIST, (_, params) => repoRepo.findAll(params));
    ipcMain.handle(Ch.GET, (_, id) => repoRepo.findById(id));
    ipcMain.handle(Ch.CREATE, (_, dto) => repoRepo.save(dto));
    ipcMain.handle(Ch.UPDATE, (_, dto) => repoRepo.save(dto));
    ipcMain.handle(Ch.DELETE, (_, id) => repoRepo.delete(id));

    // Resource CRUD
    ipcMain.handle(Ch.RESOURCE_LIST, (_, params) => resourceRepo.findAll(params));
    ipcMain.handle(Ch.RESOURCE_GET, (_, id) => resourceRepo.findById(id));
    ipcMain.handle(Ch.RESOURCE_CREATE, (_, dto) => resourceRepo.save(dto));
    ipcMain.handle(Ch.RESOURCE_UPDATE, (_, dto) => resourceRepo.save(dto));
    ipcMain.handle(Ch.RESOURCE_DELETE, (_, id) => resourceRepo.delete(id));

    // Folder CRUD
    ipcMain.handle(Ch.FOLDER_LIST, (_, params) => folderRepo.findAll(params));
    ipcMain.handle(Ch.FOLDER_CREATE, (_, dto) => folderRepo.save(dto));
    ipcMain.handle(Ch.FOLDER_UPDATE, (_, dto) => folderRepo.save(dto));
    ipcMain.handle(Ch.FOLDER_DELETE, (_, id) => folderRepo.delete(id));

    // Search
    ipcMain.handle(Ch.SEARCH, (_, params) => mod.syncService.search(params));

    logger.info('Repository module registered');
  },

  destroy(): void {
    for (const ch of channels) {
      ipcMain.removeHandler(ch);
    }
    logger.info('Repository module destroyed');
  },
};
