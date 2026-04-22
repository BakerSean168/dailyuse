import type { Result } from '@dailyuse/contracts/result';
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
import type {
  EditorContentReadResult,
  IEditorApiClient,
  SaveEditorContentRequest,
} from '../infrastructure-client/adapters/types';

export class EditorClientService {
  constructor(private readonly editorApi: IEditorApiClient) {}

  listWorkspaces(): Promise<Result<EditorWorkspaceClientDTO[]>> {
    return this.editorApi.listWorkspaces();
  }

  getWorkspace(workspaceId: string): Promise<Result<EditorWorkspaceClientDTO | null>> {
    return this.editorApi.getWorkspace(workspaceId);
  }

  createWorkspace(
    request: CreateEditorWorkspaceRequest,
  ): Promise<Result<EditorWorkspaceClientDTO | null>> {
    return this.editorApi.createWorkspace(request);
  }

  updateWorkspace(
    workspaceId: string,
    request: UpdateEditorWorkspaceRequest,
  ): Promise<Result<EditorWorkspaceClientDTO | null>> {
    return this.editorApi.updateWorkspace(workspaceId, request);
  }

  deleteWorkspace(workspaceId: string): Promise<Result<void>> {
    return this.editorApi.deleteWorkspace(workspaceId);
  }

  listSessions(workspaceId: string): Promise<Result<EditorSessionClientDTO[]>> {
    return this.editorApi.listSessions(workspaceId);
  }

  getSession(sessionId: string): Promise<Result<EditorSessionClientDTO | null>> {
    return this.editorApi.getSession(sessionId);
  }

  createSession(
    request: CreateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO | null>> {
    return this.editorApi.createSession(request);
  }

  updateSession(
    sessionId: string,
    request: UpdateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO | null>> {
    return this.editorApi.updateSession(sessionId, request);
  }

  activateSession(workspaceId: string, sessionId: string): Promise<Result<EditorSessionClientDTO | null>> {
    return this.editorApi.activateSession(workspaceId, sessionId);
  }

  deleteSession(sessionId: string): Promise<Result<void>> {
    return this.editorApi.deleteSession(sessionId);
  }

  createGroup(
    request: CreateEditorGroupRequest & { workspaceId: string },
  ): Promise<Result<EditorGroupClientDTO | null>> {
    return this.editorApi.createGroup(request);
  }

  updateGroup(
    groupId: string,
    request: UpdateEditorGroupRequest & { workspaceId: string; sessionId: string },
  ): Promise<Result<EditorGroupClientDTO | null>> {
    return this.editorApi.updateGroup(groupId, request);
  }

  deleteGroup(workspaceId: string, sessionId: string, groupId: string): Promise<Result<void>> {
    return this.editorApi.deleteGroup(workspaceId, sessionId, groupId);
  }

  createTab(
    request: CreateEditorTabRequest & { workspaceId: string },
  ): Promise<Result<EditorTabClientDTO | null>> {
    return this.editorApi.createTab(request);
  }

  updateTab(
    tabId: string,
    request: UpdateEditorTabRequest & { workspaceId: string; sessionId: string; groupId: string },
  ): Promise<Result<EditorTabClientDTO | null>> {
    return this.editorApi.updateTab(tabId, request);
  }

  activateTab(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    tabId: string,
  ): Promise<Result<void>> {
    return this.editorApi.activateTab(workspaceId, sessionId, groupId, tabId);
  }

  deleteTab(workspaceId: string, sessionId: string, groupId: string, tabId: string): Promise<Result<void>> {
    return this.editorApi.deleteTab(workspaceId, sessionId, groupId, tabId);
  }

  getContent(resourceId: string): Promise<Result<EditorContentReadResult | null>> {
    return this.editorApi.getContent(resourceId);
  }

  saveContent(resourceId: string, request: SaveEditorContentRequest): Promise<Result<void>> {
    return this.editorApi.saveContent(resourceId, request);
  }

  autoSaveContent(resourceId: string, request: SaveEditorContentRequest): Promise<Result<void>> {
    return this.editorApi.autoSaveContent(resourceId, request);
  }

  searchResources(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.editorApi.searchResources(request);
  }
}
