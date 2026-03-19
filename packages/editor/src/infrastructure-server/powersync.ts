/**
 * PowerSync convenience factory for the editor module.
 * 编辑器模块的 PowerSync 便捷工厂。
 *
 * Used by the Electron entry point to assemble the module with
 * PowerSync-backed repositories and the local database.
 *
 * Electron 入口点使用此工厂来组装 PowerSync 仓储的模块实例。
 */

import { createEditorModule, type EditorModuleInstance } from './editor.module';
import {
  PowerSyncEditorWorkspaceRepository,
  PowerSyncEditorSessionRepository,
  PowerSyncEditorGroupRepository,
  PowerSyncEditorTabRepository,
} from './adapters/powersync';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IRepositoryContentPort, IRepositorySearchPort } from '../application-server';

/**
 * Creates an editor module instance backed by PowerSync local database.
 * 创建由 PowerSync 本地数据库支持的编辑器模块实例。
 */
export function createEditorPowerSyncModule(
  db: IElectronDatabase,
  ports: {
    repositoryContentPort: IRepositoryContentPort;
    repositorySearchPort: IRepositorySearchPort;
  },
): EditorModuleInstance {
  return createEditorModule({
    workspaceRepository: new PowerSyncEditorWorkspaceRepository(db),
    sessionRepository: new PowerSyncEditorSessionRepository(db),
    groupRepository: new PowerSyncEditorGroupRepository(db),
    tabRepository: new PowerSyncEditorTabRepository(db),
    repositoryContentPort: ports.repositoryContentPort,
    repositorySearchPort: ports.repositorySearchPort,
  });
}

export {
  PowerSyncEditorWorkspaceRepository,
  PowerSyncEditorSessionRepository,
  PowerSyncEditorGroupRepository,
  PowerSyncEditorTabRepository,
};
