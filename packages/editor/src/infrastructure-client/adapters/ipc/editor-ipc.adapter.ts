import type { Result } from '@dailyuse/contracts/result';
import { EditorChannels } from '@dailyuse/contracts/electron';
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
  IResultIpcClient,
  SaveEditorContentRequest,
} from '../types';

export class EditorIpcAdapter implements IEditorApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  listWorkspaces(): Promise<Result<EditorWorkspaceClientDTO[]>> {
    return this.ipcClient.invoke(EditorChannels.WORKSPACE_LIST);
  }

  getWorkspace(workspaceId: string): Promise<Result<EditorWorkspaceClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.WORKSPACE_GET, workspaceId);
  }

  createWorkspace(
    request: CreateEditorWorkspaceRequest,
  ): Promise<Result<EditorWorkspaceClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.WORKSPACE_CREATE, request);
  }

  updateWorkspace(
    workspaceId: string,
    request: UpdateEditorWorkspaceRequest,
  ): Promise<Result<EditorWorkspaceClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.WORKSPACE_UPDATE, { workspaceId, data: request });
  }

  deleteWorkspace(workspaceId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(EditorChannels.WORKSPACE_DELETE, workspaceId);
  }

  listSessions(workspaceId: string): Promise<Result<EditorSessionClientDTO[]>> {
    return this.ipcClient.invoke(EditorChannels.SESSION_LIST, workspaceId);
  }

  getSession(sessionId: string): Promise<Result<EditorSessionClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.SESSION_GET, sessionId);
  }

  createSession(
    request: CreateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.SESSION_CREATE, request);
  }

  updateSession(
    sessionId: string,
    request: UpdateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.SESSION_UPDATE, { sessionId, data: request });
  }

  activateSession(workspaceId: string, sessionId: string): Promise<Result<EditorSessionClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.SESSION_ACTIVATE, { workspaceId, sessionId });
  }

  deleteSession(sessionId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(EditorChannels.SESSION_DELETE, sessionId);
  }

  createGroup(
    request: CreateEditorGroupRequest,
  ): Promise<Result<EditorGroupClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.GROUP_CREATE, request);
  }

  updateGroup(
    groupId: string,
    request: UpdateEditorGroupRequest,
  ): Promise<Result<EditorGroupClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.GROUP_UPDATE, { groupId, data: request });
  }

  deleteGroup(workspaceId: string, sessionId: string, groupId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(EditorChannels.GROUP_DELETE, { workspaceId, sessionId, groupId });
  }

  createTab(
    request: CreateEditorTabRequest,
  ): Promise<Result<EditorTabClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.TAB_CREATE, request);
  }

  updateTab(
    tabId: string,
    request: UpdateEditorTabRequest,
  ): Promise<Result<EditorTabClientDTO | null>> {
    return this.ipcClient.invoke(EditorChannels.TAB_UPDATE, { tabId, data: request });
  }

  activateTab(workspaceId: string, sessionId: string, groupId: string, tabId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(EditorChannels.TAB_ACTIVATE, {
      workspaceId,
      sessionId,
      groupId,
      tabId,
    });
  }

  deleteTab(workspaceId: string, sessionId: string, groupId: string, tabId: string): Promise<Result<void>> {
    return this.ipcClient.invoke(EditorChannels.TAB_DELETE, {
      workspaceId,
      sessionId,
      groupId,
      tabId,
    });
  }

  getContent(resourceId: string): Promise<Result<EditorContentReadResult | null>> {
    return this.ipcClient.invoke(EditorChannels.GET_CONTENT, resourceId);
  }

  saveContent(resourceId: string, request: SaveEditorContentRequest): Promise<Result<void>> {
    return this.ipcClient.invoke(EditorChannels.SAVE_CONTENT, {
      resourceId,
      content: request.content,
    });
  }

  autoSaveContent(resourceId: string, request: SaveEditorContentRequest): Promise<Result<void>> {
    return this.ipcClient.invoke(EditorChannels.AUTO_SAVE, {
      resourceId,
      content: request.content,
    });
  }

  searchResources(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.ipcClient.invoke(EditorChannels.SEARCH, request);
  }
}

export function createEditorIpcAdapter(ipcClient: IResultIpcClient): EditorIpcAdapter {
  return new EditorIpcAdapter(ipcClient);
}
