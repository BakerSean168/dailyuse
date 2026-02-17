/**
 * Editor Module — Electron Entry Point
 *
 * The Editor module depends on the Repository module's storage layer.
 * The host application must provide an `IRepositoryContentPort` implementation.
 *
 * @module editor/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import type { IRepositoryContentPort } from '../application-server';
import { EditorContainer } from '../infrastructure-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EditorElectron');

const Ch = {
  DOCUMENT_LIST: 'editor:document:list',
  DOCUMENT_GET: 'editor:document:get',
  DOCUMENT_CREATE: 'editor:document:create',
  DOCUMENT_UPDATE: 'editor:document:update',
  DOCUMENT_DELETE: 'editor:document:delete',
  DOCUMENT_SAVE: 'editor:document:save',
  GET_CONTENT: 'editor:content:get',
  SAVE_CONTENT: 'editor:content:save',
  AUTO_SAVE: 'editor:content:auto-save',
  SEARCH: 'editor:search',
} as const;

const channels = Object.values(Ch);

/**
 * Additional parameters required by the Editor module.
 */
export interface EditorElectronParams {
  /** Bridge to the Repository module's file content. */
  contentPort: IRepositoryContentPort;
}

/**
 * Factory — creates the Editor Electron module with injected cross-module deps.
 */
export function createEditorElectronModule(params: EditorElectronParams): IElectronModule {
  return {
    name: 'Editor',

    register(ctx: IElectronModuleContext): void {
      const { contentPort } = params;

      // Initialize the Editor container with the database
      const container = EditorContainer.getInstance();
      container.initialize(ctx.db);

      const workspaceRepo = container.getEditorWorkspaceRepository();

      // IPC Handlers
      ipcMain.handle(
        Ch.DOCUMENT_LIST,
        (_, params) => workspaceRepo.findByIdentityId(params?.identityId ?? params),
      );
      ipcMain.handle(Ch.DOCUMENT_GET, (_, id) => workspaceRepo.findById(id));
      ipcMain.handle(Ch.GET_CONTENT, (_, resourceId) => contentPort.getContent(resourceId));
      ipcMain.handle(Ch.SAVE_CONTENT, (_, dto) => contentPort.saveContent(dto));
      ipcMain.handle(Ch.AUTO_SAVE, (_, dto) => contentPort.saveContent(dto));

      logger.info('Editor module registered');
    },

    destroy(): void {
      for (const ch of channels) {
        ipcMain.removeHandler(ch);
      }
      EditorContainer.getInstance().reset();
      logger.info('Editor module destroyed');
    },
  };
}
