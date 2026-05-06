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
  IResultHttpClient,
} from '../types';

export class EditorHttpAdapter implements IEditorApiClient {
  private readonly baseUrl = '/editor';

  constructor(private readonly httpClient: IResultHttpClient) {}

  listWorkspaces(): Promise<Result<EditorWorkspaceClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/workspaces`);
  }

  getWorkspace(workspaceId: string): Promise<Result<EditorWorkspaceClientDTO | null>> {
    return this.httpClient.get(`${this.baseUrl}/workspaces/${workspaceId}`);
  }

  createWorkspace(
    request: CreateEditorWorkspaceRequest,
  ): Promise<Result<EditorWorkspaceClientDTO | null>> {
    return this.httpClient.post(`${this.baseUrl}/workspaces`, request);
  }

  updateWorkspace(
    workspaceId: string,
    request: UpdateEditorWorkspaceRequest,
  ): Promise<Result<EditorWorkspaceClientDTO | null>> {
    return this.httpClient.put(`${this.baseUrl}/workspaces/${workspaceId}`, request);
  }

  deleteWorkspace(workspaceId: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/workspaces/${workspaceId}`);
  }

  listSessions(workspaceId: string): Promise<Result<EditorSessionClientDTO[]>> {
    return this.httpClient.get(`${this.baseUrl}/workspaces/${workspaceId}/sessions`);
  }

  getSession(sessionId: string): Promise<Result<EditorSessionClientDTO | null>> {
    return this.httpClient.get(`${this.baseUrl}/sessions/${sessionId}`);
  }

  createSession(
    request: CreateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO | null>> {
    return this.httpClient.post(`${this.baseUrl}/sessions`, request);
  }

  updateSession(
    sessionId: string,
    request: UpdateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO | null>> {
    return this.httpClient.put(`${this.baseUrl}/sessions/${sessionId}`, request);
  }

  activateSession(workspaceId: string, sessionId: string): Promise<Result<EditorSessionClientDTO | null>> {
    return this.httpClient.post(
      `${this.baseUrl}/workspaces/${workspaceId}/sessions/${sessionId}/activate`,
      {},
    );
  }

  deleteSession(sessionId: string): Promise<Result<void>> {
    return this.httpClient.delete(`${this.baseUrl}/sessions/${sessionId}`);
  }

  createGroup(
    request: CreateEditorGroupRequest,
  ): Promise<Result<EditorGroupClientDTO | null>> {
    return this.httpClient.post(`${this.baseUrl}/groups`, request);
  }

  updateGroup(
    groupId: string,
    request: UpdateEditorGroupRequest,
  ): Promise<Result<EditorGroupClientDTO | null>> {
    return this.httpClient.put(`${this.baseUrl}/groups/${groupId}`, request);
  }

  deleteGroup(workspaceId: string, sessionId: string, groupId: string): Promise<Result<void>> {
    return this.httpClient.delete(
      `${this.baseUrl}/workspaces/${workspaceId}/sessions/${sessionId}/groups/${groupId}`,
    );
  }

  createTab(
    request: CreateEditorTabRequest,
  ): Promise<Result<EditorTabClientDTO | null>> {
    return this.httpClient.post(`${this.baseUrl}/tabs`, request);
  }

  updateTab(
    tabId: string,
    request: UpdateEditorTabRequest,
  ): Promise<Result<EditorTabClientDTO | null>> {
    return this.httpClient.put(`${this.baseUrl}/tabs/${tabId}`, request);
  }

  activateTab(workspaceId: string, sessionId: string, groupId: string, tabId: string): Promise<Result<void>> {
    return this.httpClient.post(
      `${this.baseUrl}/workspaces/${workspaceId}/sessions/${sessionId}/groups/${groupId}/tabs/${tabId}/activate`,
      {},
    );
  }

  deleteTab(workspaceId: string, sessionId: string, groupId: string, tabId: string): Promise<Result<void>> {
    return this.httpClient.delete(
      `${this.baseUrl}/workspaces/${workspaceId}/sessions/${sessionId}/groups/${groupId}/tabs/${tabId}`,
    );
  }

  getContent(resourceId: string): Promise<Result<EditorContentReadResult | null>> {
    return this.httpClient.get(`${this.baseUrl}/content/${resourceId}`);
  }

  saveContent(resourceId: string, request: SaveEditorContentRequest): Promise<Result<void>> {
    return this.httpClient.put(`${this.baseUrl}/content/${resourceId}`, request);
  }

  autoSaveContent(resourceId: string, request: SaveEditorContentRequest): Promise<Result<void>> {
    return this.httpClient.post(`${this.baseUrl}/content/${resourceId}/auto-save`, request);
  }

  searchResources(request: SearchRequest): Promise<Result<SearchResponse>> {
    return this.httpClient.get(`${this.baseUrl}/search`, {
      params: request as unknown as Record<string, unknown>,
    });
  }
}

export function createEditorHttpAdapter(httpClient: IResultHttpClient): EditorHttpAdapter {
  return new EditorHttpAdapter(httpClient);
}
