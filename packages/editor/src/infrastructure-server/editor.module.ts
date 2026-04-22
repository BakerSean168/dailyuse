import type { Context } from '@dailyuse/contracts/shared';
import { ok, type Result } from '@dailyuse/contracts/result';
import type {
  SearchRequest,
  CreateEditorWorkspaceReq,
  UpdateEditorWorkspaceReq,
  CreateEditorSessionRequest,
  UpdateEditorSessionRequest,
  CreateEditorGroupRequest,
  UpdateEditorGroupRequest,
  CreateEditorTabRequest,
  UpdateEditorTabRequest,
} from '@dailyuse/contracts/editor';
import type { IEditorWorkspaceRepository } from '../domain-server/repositories/IEditorWorkspaceRepository';
import type { IEditorSessionRepository } from '../domain-server/repositories/IEditorSessionRepository';
import type { IEditorGroupRepository } from '../domain-server/repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../domain-server/repositories/IEditorTabRepository';
import type { IRepositoryContentPort, IRepositorySearchPort } from '../application-server';
import {
  EditorWorkspaceApplicationService,
  EditorSessionApplicationService,
} from '../application-server';

export type EditorRuntimeContributionsInput =
  | EditorModuleRuntimeContribution
  | readonly EditorModuleRuntimeContribution[];

export interface EditorModuleDependencies {
  readonly workspaceRepository: IEditorWorkspaceRepository;
  readonly sessionRepository: IEditorSessionRepository;
  readonly groupRepository: IEditorGroupRepository;
  readonly tabRepository: IEditorTabRepository;
  readonly repositoryContentPort: IRepositoryContentPort;
  readonly repositorySearchPort: IRepositorySearchPort;
  readonly runtimeContributions?: EditorRuntimeContributionsInput;
}

export interface EditorModuleRuntimeContribution {
  start(): void;
  stop(): void;
}

export interface EditorApplicationPort {
  createWorkspace(data: CreateEditorWorkspaceReq, ctx: Context): Promise<Result<unknown>>;
  listWorkspaces(ctx: Context): Promise<Result<unknown>>;
  getWorkspace(id: string): Promise<Result<unknown>>;
  updateWorkspace(id: string, data: UpdateEditorWorkspaceReq): Promise<Result<unknown>>;
  deleteWorkspace(id: string): Promise<Result<unknown>>;
  createSession(data: CreateEditorSessionRequest, ctx: Context): Promise<Result<unknown>>;
  listSessions(workspaceId: string, ctx: Context): Promise<Result<unknown>>;
  getSession(id: string, ctx: Context): Promise<Result<unknown>>;
  updateSession(
    id: string,
    data: UpdateEditorSessionRequest,
    ctx: Context,
  ): Promise<Result<unknown>>;
  activateSession(workspaceId: string, sessionId: string, ctx: Context): Promise<Result<unknown>>;
  deleteSession(id: string, ctx: Context): Promise<Result<unknown>>;
  createGroup(
    data: CreateEditorGroupRequest & { workspaceId: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  updateGroup(
    id: string,
    data: UpdateEditorGroupRequest & { workspaceId: string; sessionId: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  deleteGroup(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  createTab(
    data: CreateEditorTabRequest & { workspaceId: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  updateTab(
    id: string,
    data: UpdateEditorTabRequest & { workspaceId: string; sessionId: string; groupId: string },
    ctx: Context,
  ): Promise<Result<unknown>>;
  activateTab(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    tabId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  deleteTab(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    tabId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  getContent(resourceId: string, ctx: Context): Promise<Result<unknown>>;
  saveContent(resourceId: string, content: string, ctx: Context): Promise<Result<unknown>>;
  autoSaveContent(resourceId: string, content: string, ctx: Context): Promise<Result<unknown>>;
  searchResources(request: SearchRequest, ctx: Context): Promise<Result<unknown>>;
}

export interface EditorModuleInstance {
  readonly workspaceRepository: IEditorWorkspaceRepository;
  readonly sessionRepository: IEditorSessionRepository;
  readonly groupRepository: IEditorGroupRepository;
  readonly tabRepository: IEditorTabRepository;
  readonly api: EditorApplicationPort;
  start(): void;
  dispose(): void;
}

function normalizeRuntimeContributions(
  runtimeContributions?: EditorRuntimeContributionsInput,
): readonly EditorModuleRuntimeContribution[] {
  if (!runtimeContributions) {
    return [];
  }

  return Array.isArray(runtimeContributions)
    ? Array.from(runtimeContributions)
    : [runtimeContributions as EditorModuleRuntimeContribution];
}

export function createEditorModule(dependencies: EditorModuleDependencies): EditorModuleInstance {
  const {
    workspaceRepository,
    sessionRepository,
    groupRepository,
    tabRepository,
    repositoryContentPort,
    repositorySearchPort,
  } = dependencies;
  const runtimeContributions = normalizeRuntimeContributions(dependencies.runtimeContributions);
  const workspaceService = new EditorWorkspaceApplicationService(
    workspaceRepository,
    sessionRepository,
    groupRepository,
    tabRepository,
  );
  const sessionService = new EditorSessionApplicationService(
    sessionRepository,
    workspaceRepository,
    groupRepository,
    tabRepository,
    repositoryContentPort,
  );
  let started = false;

  const api: EditorApplicationPort = {
    createWorkspace: async (data, ctx) =>
      ok(
        await workspaceService.createWorkspace({
          identityId: ctx.identityId,
          name: data.name,
          description: data.description ?? undefined,
          projectPath: data.projectPath,
          projectType: data.projectType,
          layout: data.layout ?? undefined,
          settings: data.settings ?? undefined,
        }),
      ),

    listWorkspaces: async (ctx) =>
      ok(await workspaceService.getWorkspacesByAccount(ctx.identityId)),

    getWorkspace: async (id) => ok(await workspaceService.getWorkspace(id)),

    updateWorkspace: async (id, data) =>
      ok(
        await workspaceService.updateWorkspace({
          id,
          name: data.name,
          description: data.description ?? undefined,
        }),
      ),

    deleteWorkspace: async (id) => {
      await workspaceService.deleteWorkspace(id);
      return ok(null);
    },

    createSession: async (data, ctx) =>
      ok(await sessionService.createSession(ctx.identityId, data)),

    listSessions: async (workspaceId) => ok(await workspaceService.getSessions(workspaceId)),

    getSession: async (id) => ok(await workspaceService.getSession(id)),

    updateSession: async (id, data) => {
      const session = await workspaceService.getSession(id);
      if (!session) {
        return ok(null);
      }

      return ok(
        await workspaceService.updateSession({
          workspaceId: session.workspaceId,
          sessionId: id,
          name: data.name,
          layout: data.layout ?? undefined,
          isActive: undefined,
        }),
      );
    },

    activateSession: async (workspaceId, sessionId) => {
      await workspaceService.activateSession(workspaceId, sessionId);
      return ok(await workspaceService.getSession(sessionId));
    },

    deleteSession: async (id) => {
      const session = await workspaceService.getSession(id);
      if (session) {
        await workspaceService.removeSession(session.workspaceId, id);
      }
      return ok(null);
    },

    createGroup: async (data) =>
      ok(
        await workspaceService.addGroup({
          workspaceId: data.workspaceId,
          sessionId: data.sessionId,
          groupIndex: data.groupIndex,
          name: data.name ?? undefined,
        }),
      ),

    updateGroup: async (id, data) =>
      ok(
        await workspaceService.updateGroup({
          workspaceId: data.workspaceId,
          sessionId: data.sessionId,
          groupId: id,
          name: data.name ?? undefined,
          activeTabIndex: data.activeTabIndex,
        }),
      ),

    deleteGroup: async (workspaceId, sessionId, groupId) => {
      await workspaceService.removeGroup(workspaceId, sessionId, groupId);
      return ok(null);
    },

    createTab: async (data) =>
      ok(
        await workspaceService.addTab({
          workspaceId: data.workspaceId,
          sessionId: data.sessionId,
          groupId: data.groupId,
          resourceId: data.resourceId ?? undefined,
          tabIndex: data.tabIndex,
          tabType: data.tabType,
          title: data.title,
          viewState: data.viewState ?? undefined,
        }),
      ),

    updateTab: async (id, data) =>
      ok(
        await workspaceService.updateTab({
          workspaceId: data.workspaceId,
          sessionId: data.sessionId,
          groupId: data.groupId,
          tabId: id,
          title: data.title,
          viewState: data.viewState ?? undefined,
          isPinned: data.isPinned,
          isDirty: data.isDirty,
        }),
      ),

    activateTab: async (workspaceId, sessionId, groupId, tabId) => {
      await workspaceService.activateTab(workspaceId, sessionId, groupId, tabId);
      return ok(null);
    },

    deleteTab: async (workspaceId, sessionId, groupId, tabId) => {
      await workspaceService.removeTab(workspaceId, sessionId, groupId, tabId);
      return ok(null);
    },

    getContent: async (resourceId) => ok(await repositoryContentPort.getContent(resourceId)),

    saveContent: async (resourceId, content) => {
      await sessionService.saveContent(resourceId, content);
      return ok(null);
    },

    autoSaveContent: async (resourceId, content) => {
      await sessionService.saveContent(resourceId, content);
      return ok(null);
    },

    searchResources: async (request, ctx) => ok(await repositorySearchPort.search(request, ctx)),
  };

  return {
    workspaceRepository,
    sessionRepository,
    groupRepository,
    tabRepository,
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
