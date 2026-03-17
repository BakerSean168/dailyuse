/**
 * Editor Module — Electron Entry Point.
 * 编辑器模块 — Electron 入口点。
 *
 * Self-contained editor runtime assembly for Electron main process.
 * 编辑器模块在 Electron 主进程中的自包含运行时组装。
 *
 * Instantiates PowerSync repositories through the module factory,
 * and registers IPC handlers for workspace / document / content operations.
 * All IPC handlers route through `editorModule.api` (the transport-neutral
 * application port) instead of calling repositories directly.
 *
 * 通过模块工厂实例化 PowerSync 仓储，并注册工作区 / 文档 / 内容操作的 IPC 处理器。
 * 所有 IPC 处理器通过 `editorModule.api`（传输层无关的应用门面）路由，
 * 而非直接调用仓储。
 *
 * The Editor module depends on the Repository module's storage layer.
 * The host application must provide an `IRepositoryContentPort` implementation.
 * 编辑器模块依赖仓库模块的存储层。
 * 宿主应用必须提供 `IRepositoryContentPort` 实现。
 *
 * This file follows the governance canonical pattern:
 * 此文件遵循治理模块的规范模式：
 * - Composition root via PowerSync factory
 *   通过 PowerSync 工厂的组合根
 * - Static Electron context for desktop-local operations
 *   桌面本地操作使用静态 Electron 上下文
 * - All handlers delegate to `module.api` facade
 *   所有处理器委托给 `module.api` 门面
 *
 * @module editor/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import type { Context } from '@dailyuse/contracts/shared';
import type { IRepositoryContentPort } from '../application-server';
import { createEditorPowerSyncModule } from '../infrastructure-server/powersync';
import type { EditorModuleInstance } from '../infrastructure-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EditorElectron');

// ---------------------------------------------------------------------------
// IPC Channel constants — IPC 通道常量
// ---------------------------------------------------------------------------

const Ch = {
  DOCUMENT_LIST: 'editor:list-documents',
  DOCUMENT_GET: 'editor:get-document',
  DOCUMENT_CREATE: 'editor:create-document',
  DOCUMENT_UPDATE: 'editor:update-document',
  DOCUMENT_DELETE: 'editor:delete-document',
  DOCUMENT_SAVE: 'editor:save-document',
  GET_CONTENT: 'editor:get-content',
  SAVE_CONTENT: 'editor:save-content',
  AUTO_SAVE: 'editor:auto-save-content',
  SEARCH: 'editor:search-documents',
} as const;

const channels = Object.values(Ch);

// ---------------------------------------------------------------------------
// External dependency interface — 外部依赖接口
// ---------------------------------------------------------------------------

/**
 * Additional parameters required by the Editor module.
 * 编辑器模块所需的额外参数。
 *
 * Cross-module dependencies are expressed as explicit interface parameters
 * rather than hidden singleton lookups.
 * 跨模块依赖通过显式接口参数表达，而非隐藏的单例查找。
 */
export interface EditorElectronParams {
  /** Bridge to the Repository module's file content. 仓库模块文件内容的桥接。 */
  contentPort: IRepositoryContentPort;
}

// ---------------------------------------------------------------------------
// Module singleton — 模块单例
// ---------------------------------------------------------------------------

let activeEditorModule: EditorModuleInstance | null = null;

// ---------------------------------------------------------------------------
// Factory — 工厂函数
// ---------------------------------------------------------------------------

/**
 * Factory — creates the Editor Electron module with injected cross-module deps.
 * 工厂 — 使用注入的跨模块依赖创建编辑器 Electron 模块。
 */
export function createEditorElectronModule(params: EditorElectronParams): IElectronModule {
  return {
    name: 'Editor',

    register(ctx: IElectronModuleContext): void {
      const { contentPort } = params;

      // 1. Composition Root — assemble module via PowerSync factory
      //    组合根 — 通过 PowerSync 工厂组装模块
      const editorModule = createEditorPowerSyncModule(ctx.db);
      activeEditorModule = editorModule;
      editorModule.start();

      const { api } = editorModule;

      // 2. Static Electron context for desktop-local operations.
      //    桌面本地操作使用的静态 Electron 上下文。
      //    Follows the governance canonical pattern (see governance/electron-entry).
      //    遵循治理模块的规范模式（参见 governance/electron-entry）。
      const electronContext: Context = { identityId: 'desktop-user', deviceId: 'electron-app' };

      // 3. IPC Handlers — register ALL declared channels through module.api.
      //    IPC 处理器 — 通过 module.api 注册所有已声明的通道。

      // -- Document CRUD channels -- 文档 CRUD 通道 --
      // These channels use "document" naming. They route to the api facade's
      // document methods so semantics and channel names are aligned.
      // 这些通道使用 "document" 命名。它们路由到 api 门面的文档方法，
      // 使语义与通道名对齐。
      ipcMain.handle(
        Ch.DOCUMENT_LIST,
        (_event, query?: { workspaceId?: string; folderId?: string }) =>
          api.listDocuments(
            { workspaceId: query?.workspaceId, folderId: query?.folderId },
            electronContext,
          ),
      );

      ipcMain.handle(Ch.DOCUMENT_GET, (_event, id: string) => api.getDocument(id));

      ipcMain.handle(
        Ch.DOCUMENT_CREATE,
        (
          _event,
          data: {
            workspaceId: string;
            path: string;
            name: string;
            language: string;
            content: string;
            metadata?: unknown;
          },
        ) => api.createDocument(data, electronContext),
      );

      ipcMain.handle(
        Ch.DOCUMENT_UPDATE,
        (_event, payload: { id: string; content?: string; metadata?: unknown }) => {
          const { id, ...data } = payload;
          return api.updateDocument(id, data);
        },
      );

      ipcMain.handle(Ch.DOCUMENT_DELETE, (_event, payload: { id: string }) =>
        api.deleteDocument(payload.id),
      );

      // DOCUMENT_SAVE — persist content through the editor document facade.
      // 文档保存 — 通过编辑器文档门面持久化内容。
      ipcMain.handle(Ch.DOCUMENT_SAVE, async (_event, payload: { id: string; content: string }) => {
        return api.updateDocument(payload.id, { content: payload.content });
      });

      // -- Content bridge channels -- 内容桥接通道 --
      // Editor content channels first operate on editor documents.
      // If no editor document exists for the provided id, they fall back to the
      // injected repository-content bridge for external resource editing.
      // 编辑器内容通道优先操作编辑器文档；若给定 id 不是编辑器文档，
      // 则回退到注入的仓库内容桥接，以支持外部资源编辑。
      ipcMain.handle(Ch.GET_CONTENT, async (_event, resourceId: string) => {
        const documentResult = await api.getDocument(resourceId);
        if (documentResult.ok && documentResult.data) {
          const document = documentResult.data as {
            id: string;
            name: string;
            content: string | null;
          };
          return {
            resourceId: document.id,
            name: document.name,
            content: document.content,
          };
        }

        return contentPort.getContent(resourceId);
      });
      ipcMain.handle(
        Ch.SAVE_CONTENT,
        async (_event, dto: { resourceId: string; content: string }) => {
          const documentResult = await api.getDocument(dto.resourceId);
          if (documentResult.ok && documentResult.data) {
            return api.updateDocument(dto.resourceId, { content: dto.content });
          }

          return contentPort.saveContent(dto);
        },
      );
      ipcMain.handle(Ch.AUTO_SAVE, async (_event, dto: { resourceId: string; content: string }) => {
        const documentResult = await api.getDocument(dto.resourceId);
        if (documentResult.ok && documentResult.data) {
          return api.updateDocument(dto.resourceId, { content: dto.content });
        }

        return contentPort.saveContent(dto);
      });

      // -- Search channel -- 搜索通道 --
      ipcMain.handle(Ch.SEARCH, async (_event, query: unknown) => {
        const requestContext = await ctx.auth.requireRequestContext();
        return api.searchDocuments((query ?? {}) as any, requestContext);
      });

      logger.info('Editor module registered — all IPC channels wired');
    },

    destroy(): void {
      for (const ch of channels) {
        ipcMain.removeHandler(ch);
      }
      activeEditorModule?.dispose();
      activeEditorModule = null;
      logger.info('Editor module destroyed');
    },
  };
}
