import type { Result } from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';
import type {
  CreateEditorGroupRequest,
  CreateEditorSessionRequest,
  CreateEditorTabRequest,
  CreateEditorWorkspaceRequest,
  SearchRequest,
  UpdateEditorGroupRequest,
  UpdateEditorSessionRequest,
  UpdateEditorTabRequest,
  UpdateEditorWorkspaceRequest,
} from '@dailyuse/contracts/editor';

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
  createGroup(data: CreateEditorGroupRequest, ctx: Context): Promise<Result<unknown>>;
  updateGroup(id: string, data: UpdateEditorGroupRequest, ctx: Context): Promise<Result<unknown>>;
  deleteGroup(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    ctx: Context,
  ): Promise<Result<unknown>>;
  createTab(data: CreateEditorTabRequest, ctx: Context): Promise<Result<unknown>>;
  updateTab(id: string, data: UpdateEditorTabRequest, ctx: Context): Promise<Result<unknown>>;
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
