import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
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
  SearchResponse,
  EditorWorkspaceClientDTO,
  EditorSessionClientDTO,
  EditorGroupClientDTO,
  EditorTabClientDTO,
} from '@dailyuse/contracts/editor';

export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

export type { IResultHttpClient };

export interface EditorContentReadResult {
  resourceId: string;
  name: string;
  content: string | null;
}

export interface SaveEditorContentRequest {
  content: string;
}

export interface IEditorApiClient {
  listWorkspaces(): Promise<Result<EditorWorkspaceClientDTO[]>>;
  getWorkspace(workspaceId: string): Promise<Result<EditorWorkspaceClientDTO | null>>;
  createWorkspace(
    request: CreateEditorWorkspaceRequest,
  ): Promise<Result<EditorWorkspaceClientDTO | null>>;
  updateWorkspace(
    workspaceId: string,
    request: UpdateEditorWorkspaceRequest,
  ): Promise<Result<EditorWorkspaceClientDTO | null>>;
  deleteWorkspace(workspaceId: string): Promise<Result<void>>;
  listSessions(workspaceId: string): Promise<Result<EditorSessionClientDTO[]>>;
  getSession(sessionId: string): Promise<Result<EditorSessionClientDTO | null>>;
  createSession(
    request: CreateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO | null>>;
  updateSession(
    sessionId: string,
    request: UpdateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO | null>>;
  activateSession(workspaceId: string, sessionId: string): Promise<Result<EditorSessionClientDTO | null>>;
  deleteSession(sessionId: string): Promise<Result<void>>;
  createGroup(
    request: CreateEditorGroupRequest & { workspaceId: string },
  ): Promise<Result<EditorGroupClientDTO | null>>;
  updateGroup(
    groupId: string,
    request: UpdateEditorGroupRequest & { workspaceId: string; sessionId: string },
  ): Promise<Result<EditorGroupClientDTO | null>>;
  deleteGroup(workspaceId: string, sessionId: string, groupId: string): Promise<Result<void>>;
  createTab(
    request: CreateEditorTabRequest & { workspaceId: string },
  ): Promise<Result<EditorTabClientDTO | null>>;
  updateTab(
    tabId: string,
    request: UpdateEditorTabRequest & { workspaceId: string; sessionId: string; groupId: string },
  ): Promise<Result<EditorTabClientDTO | null>>;
  activateTab(workspaceId: string, sessionId: string, groupId: string, tabId: string): Promise<Result<void>>;
  deleteTab(workspaceId: string, sessionId: string, groupId: string, tabId: string): Promise<Result<void>>;
  getContent(resourceId: string): Promise<Result<EditorContentReadResult | null>>;
  saveContent(resourceId: string, request: SaveEditorContentRequest): Promise<Result<void>>;
  autoSaveContent(resourceId: string, request: SaveEditorContentRequest): Promise<Result<void>>;
  searchResources(request: SearchRequest): Promise<Result<SearchResponse>>;
}
