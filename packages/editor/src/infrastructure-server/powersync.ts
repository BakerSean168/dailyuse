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
  PowerSyncDocumentRepository,
  PowerSyncEditorWorkspaceRepository,
} from './adapters/powersync';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';

/**
 * Creates an editor module instance backed by PowerSync local database.
 * 创建由 PowerSync 本地数据库支持的编辑器模块实例。
 *
 * Note: DocumentRepository currently lacks a PowerSync implementation.
 * The caller must provide one or a stub. In the Electron entry the
 * document CRUD goes through IPC handlers that delegate to
 * IRepositoryContentPort instead.
 *
 * 注意：DocumentRepository 目前没有 PowerSync 实现。
 * 调用方必须提供一个实现或桩。在 Electron 入口中，
 * 文档 CRUD 通过 IPC 处理器委托给 IRepositoryContentPort。
 */
export function createEditorPowerSyncModule(db: IElectronDatabase): EditorModuleInstance {
  return createEditorModule({
    workspaceRepository: new PowerSyncEditorWorkspaceRepository(db),
    documentRepository: new PowerSyncDocumentRepository(db),
  });
}

export { PowerSyncDocumentRepository, PowerSyncEditorWorkspaceRepository };
