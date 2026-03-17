/**
 * createEditorModule — explicit composition root for the editor server runtime.
 * createEditorModule —— 编辑器模块服务端运行时的显式组合根。
 *
 * The outer app selects concrete adapters and passes them in here.
 * This module then assembles the application layer exactly once and exposes a
 * stable facade to HTTP / IPC transports.
 *
 * 外层应用负责选择具体适配器并传入这里。
 * 组合根只做一次组装，然后向 HTTP / IPC 等传输层暴露稳定门面。
 *
 * This file follows the governance canonical pattern:
 * one composition root per module, constructor injection only, no hidden service locator.
 *
 * 此文件遵循治理模块的规范模式：
 * 每个模块一个组合根，仅使用构造函数注入，不使用隐藏的服务定位器。
 */

import type { IEditorWorkspaceRepository } from '../domain-server/repositories/IEditorWorkspaceRepository';
import type { IDocumentRepository } from '../domain-server/repositories/IDocumentRepository';
import type { IdentityId, EditorWorkspaceId } from '@dailyuse/contracts/primitives';
import type {
  WorkspaceLayoutServerDTO,
  WorkspaceSettingsServerDTO,
  DocumentMetadataServerDTO,
  SearchRequest,
} from '@dailyuse/contracts/editor';
import { ok, type Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import { EditorWorkspace } from '../domain-server/aggregates/editor-workspace';
import { Document } from '../domain-server/entities/document';
import { SearchDocumentsUseCase } from '../application-server';

// ---------------------------------------------------------------------------
// Dependencies — 外部依赖接口
// ---------------------------------------------------------------------------

/**
 * Everything the editor server runtime needs from the outside world.
 * 编辑器模块服务端运行时向外部索取的全部依赖。
 *
 * Refactor rule for other modules:
 * 重构规则：
 * - only put ports or runtime contributions here
 *   仅放端口或运行时贡献
 * - never put transport objects (Express req/res, ipcMain, Router) here
 *   不要放传输对象（Express req/res, ipcMain, Router）
 * - never hide these dependencies behind a singleton container
 *   不要将依赖藏在单例容器后面
 */
export type EditorRuntimeContributionsInput =
  | EditorModuleRuntimeContribution
  | readonly EditorModuleRuntimeContribution[];

export interface EditorModuleDependencies {
  readonly workspaceRepository: IEditorWorkspaceRepository;
  readonly documentRepository: IDocumentRepository;
  readonly runtimeContributions?: EditorRuntimeContributionsInput;
}

// ---------------------------------------------------------------------------
// Runtime contribution — 运行时贡献
// ---------------------------------------------------------------------------

/**
 * Module-owned runtime side effects.
 * 模块拥有的运行时副作用。
 *
 * A contribution is the unit we start/stop together with the module instance.
 * This is the replacement for older global initialization hooks.
 *
 * 贡献是与模块实例一起启动/停止的最小单元。
 * 这是旧全局初始化钩子的替代方案。
 */
export interface EditorModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

// ---------------------------------------------------------------------------
// Application port — 传输层无关的应用门面
// ---------------------------------------------------------------------------

/**
 * Request types for the editor application port.
 * 编辑器应用层门面的请求类型。
 */
export interface CreateWorkspaceReq {
  readonly name: string;
  readonly description?: string | null;
  readonly projectPath: string;
  readonly projectType: string;
  readonly layout?: unknown;
  readonly settings?: unknown;
}

export interface UpdateWorkspaceReq {
  readonly name?: string;
  readonly description?: string | null;
  readonly layout?: unknown;
  readonly settings?: unknown;
}

export interface CreateDocumentReq {
  readonly workspaceId: string;
  readonly path: string;
  readonly name: string;
  readonly language: string;
  readonly content: string;
  readonly metadata?: unknown;
}

export interface UpdateDocumentReq {
  readonly content?: string;
  readonly metadata?: unknown;
}

export interface ListDocumentsQuery {
  readonly workspaceId?: string;
  readonly folderId?: string;
}

/** Transport-neutral callable application surface. 传输层无关的可调用应用层门面。 */
export interface EditorApplicationPort {
  createWorkspace(data: CreateWorkspaceReq, ctx: Context): Promise<Result<unknown>>;
  listWorkspaces(ctx: Context): Promise<Result<unknown>>;
  getWorkspace(id: string): Promise<Result<unknown>>;
  updateWorkspace(id: string, data: UpdateWorkspaceReq): Promise<Result<unknown>>;
  deleteWorkspace(id: string): Promise<Result<unknown>>;
  createDocument(data: CreateDocumentReq, ctx: Context): Promise<Result<unknown>>;
  listDocuments(params: ListDocumentsQuery, ctx: Context): Promise<Result<unknown>>;
  getDocument(id: string): Promise<Result<unknown>>;
  updateDocument(id: string, data: UpdateDocumentReq): Promise<Result<unknown>>;
  deleteDocument(id: string): Promise<Result<unknown>>;
  searchDocuments(request: SearchRequest, ctx: Context): Promise<Result<unknown>>;
}

// ---------------------------------------------------------------------------
// Module instance — 模块实例返回类型
// ---------------------------------------------------------------------------

/**
 * Primary editor composition root return type.
 * 编辑器模块主组合根返回类型。
 *
 * `api` is the transport-facing surface.
 * `start` / `dispose` own runtime side effects.
 *
 * `api` 是面向传输层的表面。
 * `start` / `dispose` 拥有运行时副作用。
 */
export interface EditorModuleInstance {
  readonly workspaceRepository: IEditorWorkspaceRepository;
  readonly documentRepository: IDocumentRepository;
  readonly api: EditorApplicationPort;
  start(): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Helpers — 辅助函数
// ---------------------------------------------------------------------------

function normalizeRuntimeContributions(
  runtimeContributions?:
    | EditorModuleRuntimeContribution
    | ReadonlyArray<EditorModuleRuntimeContribution>,
): readonly EditorModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  if (Array.isArray(runtimeContributions)) {
    return Array.from(runtimeContributions);
  }

  return [runtimeContributions as EditorModuleRuntimeContribution];
}

// ---------------------------------------------------------------------------
// Composition Root — 规范化的编辑器模块主组合根
// ---------------------------------------------------------------------------

/**
 * Canonical composition root.
 * 规范化的编辑器模块主组合根。
 *
 * This follows the governance canonical pattern. The expected reading order is:
 * 此文件遵循治理模块的规范模式。预期的阅读顺序为：
 * 1. define `Dependencies` — 定义依赖
 * 2. define transport-neutral `ApplicationPort` — 定义传输层无关的应用门面
 * 3. assemble use cases once — 组装一次用例
 * 4. wrap them in `api` — 包装到 api 门面
 * 5. let the module instance own `start` / `dispose` — 模块实例拥有 start / dispose
 */
export function createEditorModule(dependencies: EditorModuleDependencies): EditorModuleInstance {
  const { workspaceRepository, documentRepository } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const searchDocuments = new SearchDocumentsUseCase(workspaceRepository, documentRepository);
  let started = false;

  // Build the transport-neutral application port.
  // 构建传输层无关的应用门面。
  // All business logic that was previously inline in api/module.ts
  // is now encapsulated here, reusable by HTTP *and* Electron transports.
  // 之前内联在 api/module.ts 中的所有业务逻辑现在封装在这里，
  // 可被 HTTP *和* Electron 传输层复用。
  const api: EditorApplicationPort = {
    createWorkspace: async (data, ctx) => {
      const workspace = EditorWorkspace.create({
        identityId: ctx.identityId as IdentityId,
        name: data.name,
        description: data.description ?? undefined,
        projectPath: data.projectPath,
        projectType: data.projectType as any,
        layout: (data.layout as unknown as WorkspaceLayoutServerDTO) ?? undefined,
        settings: (data.settings as unknown as WorkspaceSettingsServerDTO) ?? undefined,
      });
      await workspaceRepository.save(workspace);
      return ok(workspace.toServerDTO());
    },

    listWorkspaces: async (ctx) => {
      const workspaces = await workspaceRepository.findByIdentityId(ctx.identityId);
      return ok({
        workspaces: workspaces.map((w) => w.toServerDTO()),
        total: workspaces.length,
      });
    },

    getWorkspace: async (id) => {
      const workspace = await workspaceRepository.findById(id);
      return ok(workspace?.toServerDTO() ?? null);
    },

    updateWorkspace: async (id, data) => {
      const workspace = await workspaceRepository.findById(id);
      if (!workspace) return ok(null);
      if (data.name !== undefined) workspace.updateName(data.name);
      if (data.description !== undefined) workspace.updateDescription(data.description ?? null);
      if (data.layout != null) workspace.updateLayout(data.layout);
      if (data.settings != null) workspace.updateSettings(data.settings);
      await workspaceRepository.save(workspace);
      return ok(workspace.toServerDTO());
    },

    deleteWorkspace: async (id) => {
      await workspaceRepository.delete(id);
      return ok(undefined);
    },

    createDocument: async (data, ctx) => {
      const doc = Document.create({
        workspaceId: data.workspaceId as unknown as EditorWorkspaceId,
        identityId: ctx.identityId as IdentityId,
        path: data.path,
        name: data.name,
        language: data.language as any,
        content: data.content,
        metadata: (data.metadata as unknown as DocumentMetadataServerDTO) ?? undefined,
      });
      await documentRepository.save(doc);
      return ok(doc.toServerDTO());
    },

    listDocuments: async (params, ctx) => {
      // Note: findByWorkspaceId is used for both cases because the original
      // DocumentPrismaRepository.findByIdentityId delegates to findByWorkspaceId.
      // 注意：两种情况都使用 findByWorkspaceId，因为原始的
      // DocumentPrismaRepository.findByIdentityId 实际委托给 findByWorkspaceId。
      const documents = await documentRepository.findByWorkspaceId(
        params.workspaceId ?? ctx.identityId,
      );
      return ok({
        documents: documents.map((d: Document) => d.toServerDTO()),
        total: documents.length,
      });
    },

    getDocument: async (id) => {
      const doc = await documentRepository.findById(id);
      return ok(doc?.toServerDTO() ?? null);
    },

    updateDocument: async (id, data) => {
      const doc = await documentRepository.findById(id);
      if (!doc) return ok(null);
      if (data.content !== undefined) doc.updateContent(data.content);
      if (data.metadata != null) {
        const merged = { ...doc.metadata, ...data.metadata } as DocumentMetadataServerDTO;
        doc.updateMetadata(merged);
      }
      await documentRepository.save(doc);
      return ok(doc.toServerDTO());
    },

    deleteDocument: async (id) => {
      await documentRepository.delete(id);
      return ok(undefined);
    },

    searchDocuments: async (request, ctx) => {
      const result = await searchDocuments.execute(ctx.identityId, request);
      return ok(result);
    },
  };

  return {
    workspaceRepository,
    documentRepository,
    api,
    start(): void {
      if (started) {
        return;
      }

      for (const runtime of runtimeContributions) {
        runtime.start();
      }

      started = true;
    },
    dispose(): void {
      if (!started) {
        return;
      }

      for (const runtime of [...runtimeContributions].reverse()) {
        runtime.stop();
      }

      started = false;
    },
  };
}
