/**
 * Editor Module — Electron Entry Point.
 * 编辑器模块 — Electron 入口点。
 *
 * Self-contained editor runtime assembly for Electron main process.
 * 编辑器模块在 Electron 主进程中的自包含运行时组装。
 *
 * Instantiates PowerSync repositories through the module factory,
 * and registers IPC handlers for workspace / session / group / tab / content operations.
 * All IPC handlers route through `editorModule.api` (the transport-neutral
 * application port) instead of calling repositories directly.
 *
 * 通过模块工厂实例化 PowerSync 仓储，并注册工作区 / 会话 / 分组 / 标签 / 内容操作的 IPC 处理器。
 * 所有 IPC 处理器通过 `editorModule.api`（传输层无关的应用门面）路由，
 * 而非直接调用仓储。
 *
 * The Editor module depends on the Repository module's storage layer.
 * In the current product direction, repository resources are the source of truth
 * for note content. The editor owns session and layout state only.
 * The host application must provide an `IRepositoryContentPort` implementation.
 * 编辑器模块依赖仓库模块的存储层。
 * 按当前产品方向，仓储资源才是笔记内容的真值来源；editor 只负责会话与布局状态。
 * 宿主应用必须提供 `IRepositoryContentPort` 实现。
 *
 * This file follows the governance canonical pattern:
 * 此文件遵循治理模块的规范模式：
 * - Composition root via PowerSync factory
 *   通过 PowerSync 工厂的组合根
 * - Authenticated request context for user-scoped operations
 *   用户范围操作使用认证的请求上下文
 * - All handlers delegate to `module.api` facade
 *   所有处理器委托给 `module.api` 门面
 *
 * @module editor/electron-entry
 */

import { ipcMain } from 'electron';
import type { IElectronModule, IElectronModuleContext } from '@dailyuse/contracts/electron';
import type { IRepositoryContentPort } from '../application-server';
import type { IRepositorySearchPort } from '../application-server';
import { createEditorPowerSyncModule } from '../infrastructure-server/powersync';
import type { EditorModuleInstance } from '../infrastructure-server';
import { createLogger } from '@dailyuse/utils/logger';
import { fail } from '@dailyuse/contracts/result';
import type {
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
  CreateEditorSessionRequest,
  UpdateEditorSessionRequest,
  CreateEditorGroupRequest,
  UpdateEditorGroupRequest,
  CreateEditorTabRequest,
  UpdateEditorTabRequest,
  SearchRequest,
} from '@dailyuse/contracts/editor';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('EditorElectron');

// ---------------------------------------------------------------------------
// IPC Channel constants — IPC 通道常量
// ---------------------------------------------------------------------------

const Ch = {
  WORKSPACE_LIST: 'editor:list-workspaces',
  WORKSPACE_GET: 'editor:get-workspace',
  WORKSPACE_CREATE: 'editor:create-workspace',
  WORKSPACE_UPDATE: 'editor:update-workspace',
  WORKSPACE_DELETE: 'editor:delete-workspace',
  SESSION_LIST: 'editor:list-sessions',
  SESSION_GET: 'editor:get-session',
  SESSION_CREATE: 'editor:create-session',
  SESSION_UPDATE: 'editor:update-session',
  SESSION_ACTIVATE: 'editor:activate-session',
  SESSION_DELETE: 'editor:delete-session',
  GROUP_CREATE: 'editor:create-group',
  GROUP_UPDATE: 'editor:update-group',
  GROUP_DELETE: 'editor:delete-group',
  TAB_CREATE: 'editor:create-tab',
  TAB_UPDATE: 'editor:update-tab',
  TAB_ACTIVATE: 'editor:activate-tab',
  TAB_DELETE: 'editor:delete-tab',
  GET_CONTENT: 'editor:get-content',
  SAVE_CONTENT: 'editor:save-content',
  AUTO_SAVE: 'editor:auto-save-content',
  SEARCH: 'editor:search-resources',
} as const;

const channels = Object.values(Ch);

function toLoggableError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === 'string' ? error : JSON.stringify(error),
  };
}

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
  searchPort: IRepositorySearchPort;
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
      const { contentPort, searchPort } = params;

      // 1. Composition Root — assemble module via PowerSync factory
      //    组合根 — 通过 PowerSync 工厂组装模块
      const editorModule = createEditorPowerSyncModule(ctx.db, {
        repositoryContentPort: contentPort,
        repositorySearchPort: searchPort,
      });
      activeEditorModule = editorModule;
      editorModule.start();

      const { api } = editorModule;

      ipcMain.handle(Ch.WORKSPACE_LIST, async () => {
        logger.info('[EditorIPC] list-workspaces:start');
        const result = await withAuthenticatedValue(ctx, async (requestContext) =>
          api.listWorkspaces(requestContext),
        );
        if (result.ok) {
          logger.info('[EditorIPC] list-workspaces:done', {
            workspaceCount: Array.isArray(result.data) ? result.data.length : 0,
          });
        } else {
          logger.warn('[EditorIPC] list-workspaces:failed', { error: result.error });
        }
        return result;
      });
      ipcMain.handle(Ch.WORKSPACE_GET, async (_event, workspaceId: string) =>
        api.getWorkspace(workspaceId),
      );
      ipcMain.handle(Ch.WORKSPACE_CREATE, async (_event, dto: unknown) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          api.createWorkspace(dto as CreateEditorWorkspaceRequest, requestContext),
        ),
      );
      ipcMain.handle(
        Ch.WORKSPACE_UPDATE,
        async (_event, payload: { workspaceId: string; data: unknown }) =>
          withAuthenticatedValue(ctx, async () =>
            api.updateWorkspace(payload.workspaceId, payload.data as UpdateEditorWorkspaceRequest),
          ),
      );
      ipcMain.handle(Ch.WORKSPACE_DELETE, async (_event, workspaceId: string) =>
        withAuthenticatedValue(ctx, async () => api.deleteWorkspace(workspaceId)),
      );

      ipcMain.handle(Ch.SESSION_LIST, async (_event, workspaceId: string) => {
        logger.info('[EditorIPC] list-sessions:start', { workspaceId });
        const result = await withAuthenticatedValue(ctx, async (requestContext) =>
          {
            try {
              return await api.listSessions(workspaceId, requestContext);
            } catch (error) {
              const loggableError = toLoggableError(error);
              logger.error('[EditorIPC] list-sessions:exception', {
                workspaceId,
                error: loggableError,
              });
              return fail({
                code: 'INTERNAL_ERROR',
                message: loggableError.message,
                context: { workspaceId },
              });
            }
          },
        );
        if (result.ok) {
          logger.info('[EditorIPC] list-sessions:done', {
            workspaceId,
            sessionCount: Array.isArray(result.data) ? result.data.length : 0,
          });
        } else {
          logger.warn('[EditorIPC] list-sessions:failed', { workspaceId, error: result.error });
        }
        return result;
      });
      ipcMain.handle(Ch.SESSION_GET, async (_event, sessionId: string) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          api.getSession(sessionId, requestContext),
        ),
      );
      ipcMain.handle(Ch.SESSION_CREATE, async (_event, dto: unknown) => {
        logger.info('[EditorIPC] create-session:start', { dto });
        const result = await withAuthenticatedValue(ctx, async (requestContext) =>
          {
            try {
              return await api.createSession(dto as CreateEditorSessionRequest, requestContext);
            } catch (error) {
              const loggableError = toLoggableError(error);
              logger.error('[EditorIPC] create-session:exception', {
                dto,
                error: loggableError,
              });
              return fail({
                code: 'INTERNAL_ERROR',
                message: loggableError.message,
              });
            }
          },
        );
        if (result.ok) {
          logger.info('[EditorIPC] create-session:done', {
            sessionId:
              result.data && typeof result.data === 'object' && 'id' in result.data
                ? (result.data as { id?: string }).id
                : null,
          });
        } else {
          logger.warn('[EditorIPC] create-session:failed', { dto, error: result.error });
        }
        return result;
      });
      ipcMain.handle(
        Ch.SESSION_UPDATE,
        async (_event, payload: { sessionId: string; data: unknown }) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            api.updateSession(payload.sessionId, payload.data as UpdateEditorSessionRequest, requestContext),
          ),
      );
      ipcMain.handle(
        Ch.SESSION_ACTIVATE,
        async (_event, payload: { workspaceId: string; sessionId: string }) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            api.activateSession(payload.workspaceId, payload.sessionId, requestContext),
          ),
      );
      ipcMain.handle(Ch.SESSION_DELETE, async (_event, sessionId: string) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          api.deleteSession(sessionId, requestContext),
        ),
      );

      ipcMain.handle(Ch.GROUP_CREATE, async (_event, dto: unknown) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          api.createGroup(dto as CreateEditorGroupRequest, requestContext),
        ),
      );
      ipcMain.handle(Ch.GROUP_UPDATE, async (_event, payload: { groupId: string; data: unknown }) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          api.updateGroup(payload.groupId, payload.data as UpdateEditorGroupRequest, requestContext),
        ),
      );
      ipcMain.handle(
        Ch.GROUP_DELETE,
        async (_event, payload: { workspaceId: string; sessionId: string; groupId: string }) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            api.deleteGroup(
              payload.workspaceId,
              payload.sessionId,
              payload.groupId,
              requestContext,
            ),
          ),
      );

      ipcMain.handle(Ch.TAB_CREATE, async (_event, dto: unknown) => {
        logger.info('[EditorIPC] create-tab:start', { dto });
        const result = await withAuthenticatedValue(ctx, async (requestContext) =>
          {
            try {
              return await api.createTab(dto as CreateEditorTabRequest, requestContext);
            } catch (error) {
              const loggableError = toLoggableError(error);
              logger.error('[EditorIPC] create-tab:exception', {
                dto,
                error: loggableError,
              });
              return fail({
                code: 'INTERNAL_ERROR',
                message: loggableError.message,
              });
            }
          },
        );
        if (result.ok) {
          logger.info('[EditorIPC] create-tab:done', {
            tabId:
              result.data && typeof result.data === 'object' && 'id' in result.data
                ? (result.data as { id?: string }).id
                : null,
          });
        } else {
          logger.warn('[EditorIPC] create-tab:failed', { dto, error: result.error });
        }
        return result;
      });
      ipcMain.handle(Ch.TAB_UPDATE, async (_event, payload: { tabId: string; data: unknown }) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          api.updateTab(payload.tabId, payload.data as UpdateEditorTabRequest, requestContext),
        ),
      );
      ipcMain.handle(
        Ch.TAB_ACTIVATE,
        async (
          _event,
          payload: { workspaceId: string; sessionId: string; groupId: string; tabId: string },
        ) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            api.activateTab(
              payload.workspaceId,
              payload.sessionId,
              payload.groupId,
              payload.tabId,
              requestContext,
            ),
          ),
      );
      ipcMain.handle(
        Ch.TAB_DELETE,
        async (
          _event,
          payload: { workspaceId: string; sessionId: string; groupId: string; tabId: string },
        ) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            api.deleteTab(
              payload.workspaceId,
              payload.sessionId,
              payload.groupId,
              payload.tabId,
              requestContext,
            ),
          ),
      );

      // 2. IPC Handlers — register all declared channels through module.api.
      //    IPC 处理器 — 通过 module.api 注册所有已声明的通道。
      //    All user-scoped operations use authenticated request context.
      //    所有用户范围操作使用认证的请求上下文。

      // -- Content bridge channels -- 内容桥接通道 --
      // Repository resources are the canonical content source.
      // 编辑器内容统一通过仓库资源桥接读取和保存。
      ipcMain.handle(Ch.GET_CONTENT, async (_event, resourceId: string) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          api.getContent(resourceId, requestContext),
        ),
      );
      ipcMain.handle(
        Ch.SAVE_CONTENT,
        async (_event, dto: { resourceId: string; content: string }) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            api.saveContent(dto.resourceId, dto.content, requestContext),
          ),
      );
      ipcMain.handle(Ch.AUTO_SAVE, async (_event, dto: { resourceId: string; content: string }) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          api.autoSaveContent(dto.resourceId, dto.content, requestContext),
        ),
      );

      // -- Search channel -- 搜索通道 --
      ipcMain.handle(Ch.SEARCH, async (_event, query: unknown) =>
        withAuthenticatedValue(ctx, async (requestContext) =>
          api.searchResources(query as SearchRequest, requestContext),
        ),
      );

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
