import type { Context } from '@dailyuse/contracts/shared';
import { ok, isOk, type Result } from '@dailyuse/contracts/result';
import type {
  SearchRequest,
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
  CreateEditorSessionRequest,
  UpdateEditorSessionRequest,
  CreateEditorGroupRequest,
  UpdateEditorGroupRequest,
  CreateEditorTabRequest,
  UpdateEditorTabRequest,
} from '@dailyuse/contracts/editor';
import type { IEditorWorkspaceRepository } from '../domain-server/repositories/i-editor-workspace-repository';
import type { IEditorSessionRepository } from '../domain-server/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../domain-server/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../domain-server/repositories/i-editor-tab-repository';
import type { IRepositoryContentPort, IRepositorySearchPort } from '../application-server';
import {
  CreateEditorWorkspaceUseCase,
  GetEditorWorkspaceUseCase,
  ListEditorWorkspacesUseCase,
  UpdateEditorWorkspaceUseCase,
  DeleteEditorWorkspaceUseCase,
  GetWorkspaceSessionsUseCase,
  GetWorkspaceSessionUseCase,
  UpdateWorkspaceSessionUseCase,
  RemoveWorkspaceSessionUseCase,
  AddWorkspaceGroupUseCase,
  UpdateWorkspaceGroupUseCase,
  RemoveWorkspaceGroupUseCase,
  AddWorkspaceTabUseCase,
  UpdateWorkspaceTabUseCase,
  RemoveWorkspaceTabUseCase,
  ActivateWorkspaceSessionUseCase,
  ActivateWorkspaceTabUseCase,
  CreateEditorSessionUseCase,
  SaveEditorContentUseCase,
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
  createWorkspace(data: CreateEditorWorkspaceRequest, ctx: Context): Promise<Result<unknown>>;
  listWorkspaces(ctx: Context): Promise<Result<unknown>>;
  getWorkspace(id: string): Promise<Result<unknown>>;
  updateWorkspace(id: string, data: UpdateEditorWorkspaceRequest): Promise<Result<unknown>>;
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
    data: CreateEditorGroupRequest,
    ctx: Context,
  ): Promise<Result<unknown>>;
  updateGroup(
    id: string,
    data: UpdateEditorGroupRequest,
    ctx: Context,
  ): Promise<Result<unknown>>;
  deleteGroup(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  createTab(
    data: CreateEditorTabRequest,
    ctx: Context,
  ): Promise<Result<unknown>>;
  updateTab(
    id: string,
    data: UpdateEditorTabRequest,
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

  // Workspace use cases
  const createWorkspaceUC = new CreateEditorWorkspaceUseCase(workspaceRepository);
  const getWorkspaceUC = new GetEditorWorkspaceUseCase(workspaceRepository);
  const listWorkspacesUC = new ListEditorWorkspacesUseCase(workspaceRepository);
  const updateWorkspaceUC = new UpdateEditorWorkspaceUseCase(workspaceRepository);
  const deleteWorkspaceUC = new DeleteEditorWorkspaceUseCase(workspaceRepository);

  // Workspace session use cases
  const getSessionsUC = new GetWorkspaceSessionsUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );
  const getSessionUC = new GetWorkspaceSessionUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );
  const updateSessionUC = new UpdateWorkspaceSessionUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );
  const removeSessionUC = new RemoveWorkspaceSessionUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );

  // Workspace group use cases
  const addGroupUC = new AddWorkspaceGroupUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );
  const updateGroupUC = new UpdateWorkspaceGroupUseCase(groupRepository);
  const removeGroupUC = new RemoveWorkspaceGroupUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );

  // Workspace tab use cases
  const addTabUC = new AddWorkspaceTabUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );
  const updateTabUC = new UpdateWorkspaceTabUseCase(tabRepository);
  const removeTabUC = new RemoveWorkspaceTabUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );

  // Activation use cases
  const activateSessionUC = new ActivateWorkspaceSessionUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );
  const activateTabUC = new ActivateWorkspaceTabUseCase(
    sessionRepository,
    groupRepository,
    tabRepository,
  );

  // Session lifecycle use cases
  const createSessionUseCase = new CreateEditorSessionUseCase(
    sessionRepository,
    workspaceRepository,
    groupRepository,
    tabRepository,
  );
  const saveEditorContentUseCase = new SaveEditorContentUseCase(repositoryContentPort);
  let started = false;

  const api: EditorApplicationPort = {
    createWorkspace: (data, ctx) =>
      createWorkspaceUC.execute({
        identityId: ctx.identityId,
        name: data.name,
        description: data.description ?? undefined,
        projectPath: data.projectPath,
        projectType: data.projectType,
        layout: data.layout ?? undefined,
        settings: data.settings ?? undefined,
      }),

    listWorkspaces: (ctx) => listWorkspacesUC.execute(ctx.identityId),

    getWorkspace: (id) => getWorkspaceUC.execute(id),

    updateWorkspace: (id, data) =>
      updateWorkspaceUC.execute({
        id,
        name: data.name,
        description: data.description ?? undefined,
      }),

    deleteWorkspace: (id) => deleteWorkspaceUC.execute(id) as Promise<Result<unknown>>,

    createSession: (data, ctx) => createSessionUseCase.execute(ctx.identityId, data),

    listSessions: (workspaceId) => getSessionsUC.execute(workspaceId),

    getSession: (id) => getSessionUC.execute(id),

    updateSession: async (id, data) => {
      const sessionResult = await getSessionUC.execute(id);
      if (!isOk(sessionResult) || !sessionResult.data) {
        return sessionResult;
      }

      return updateSessionUC.execute({
        workspaceId: sessionResult.data.workspaceId,
        sessionId: id,
        name: data.name,
        layout: data.layout ?? undefined,
        isActive: undefined,
      });
    },

    activateSession: async (workspaceId, sessionId) => {
      const activateResult = await activateSessionUC.execute(workspaceId, sessionId);
      if (!isOk(activateResult)) {
        return activateResult;
      }
      return getSessionUC.execute(sessionId);
    },

    deleteSession: async (id) => {
      const sessionResult = await getSessionUC.execute(id);
      if (isOk(sessionResult) && sessionResult.data) {
        await removeSessionUC.execute(sessionResult.data.workspaceId, id);
      }
      return ok(null);
    },

    createGroup: (data) =>
      addGroupUC.execute({
        workspaceId: data.workspaceId,
        sessionId: data.sessionId,
        groupIndex: data.groupIndex,
        name: data.name ?? undefined,
      }),

    updateGroup: (id, data) =>
      updateGroupUC.execute({
        workspaceId: data.workspaceId,
        sessionId: data.sessionId,
        groupId: id,
        name: data.name ?? undefined,
        activeTabIndex: data.activeTabIndex,
      }),

    deleteGroup: async (workspaceId, sessionId, groupId) => {
      await removeGroupUC.execute(workspaceId, sessionId, groupId);
      return ok(null);
    },

    createTab: (data) =>
      addTabUC.execute({
        workspaceId: data.workspaceId,
        sessionId: data.sessionId,
        groupId: data.groupId,
        resourceId: data.resourceId ?? undefined,
        tabIndex: data.tabIndex,
        tabType: data.tabType,
        title: data.title,
        viewState: data.viewState ?? undefined,
      }),

    updateTab: (id, data) =>
      updateTabUC.execute({
        workspaceId: data.workspaceId,
        sessionId: data.sessionId,
        groupId: data.groupId,
        tabId: id,
        title: data.title,
        viewState: data.viewState ?? undefined,
        isPinned: data.isPinned,
        isDirty: data.isDirty,
      }),

    activateTab: async (workspaceId, sessionId, groupId, tabId) => {
      await activateTabUC.execute(workspaceId, sessionId, groupId, tabId);
      return ok(null);
    },

    deleteTab: async (workspaceId, sessionId, groupId, tabId) => {
      await removeTabUC.execute(workspaceId, sessionId, groupId, tabId);
      return ok(null);
    },

    getContent: async (resourceId) => ok(await repositoryContentPort.getContent(resourceId)),

    saveContent: async (resourceId, content) => {
      await saveEditorContentUseCase.execute(resourceId, content);
      return ok(null);
    },

    autoSaveContent: async (resourceId, content) => {
      await saveEditorContentUseCase.execute(resourceId, content);
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
