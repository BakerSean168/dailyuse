import { EditorChannels } from '@dailyuse/contracts/electron';
import type {
  EditorSessionClientDTO,
  EditorTabClientDTO,
  EditorGroupClientDTO,
} from '@dailyuse/contracts/editor';

function getElectronApi() {
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
}

export async function listEditorSessions(workspaceId: string): Promise<EditorSessionClientDTO[]> {
  const api = getElectronApi();
  if (!api) {
    return [];
  }

  const result = (await api.invoke(EditorChannels.SESSION_LIST, workspaceId)) as {
    ok?: boolean;
    data?: EditorSessionClientDTO[];
  };

  return result?.ok && Array.isArray(result.data) ? result.data : [];
}

export async function createEditorSession(
  workspaceId: string,
  name: string,
): Promise<EditorSessionClientDTO | null> {
  const api = getElectronApi();
  if (!api) {
    return null;
  }

  const result = (await api.invoke(EditorChannels.SESSION_CREATE, {
    workspaceId,
    name,
  })) as { ok?: boolean; data?: EditorSessionClientDTO | null };

  return result?.ok ? (result.data ?? null) : null;
}

export async function createEditorTab(payload: {
  workspaceId: string;
  sessionId: string;
  groupId: string;
  resourceId: string;
  title: string;
}): Promise<EditorTabClientDTO | null> {
  const api = getElectronApi();
  if (!api) {
    return null;
  }

  const result = (await api.invoke(EditorChannels.TAB_CREATE, {
    workspaceId: payload.workspaceId,
    sessionId: payload.sessionId,
    groupId: payload.groupId,
    resourceId: payload.resourceId,
    title: payload.title,
    tabIndex: 0,
    tabType: 'Resource',
  })) as { ok?: boolean; data?: EditorTabClientDTO | null };

  return result?.ok ? (result.data ?? null) : null;
}

export async function activateEditorTab(payload: {
  workspaceId: string;
  sessionId: string;
  groupId: string;
  tabId: string;
}): Promise<void> {
  const api = getElectronApi();
  if (!api) {
    return;
  }

  await api.invoke(EditorChannels.TAB_ACTIVATE, payload);
}

export async function deleteEditorTab(payload: {
  workspaceId: string;
  sessionId: string;
  groupId: string;
  tabId: string;
}): Promise<void> {
  const api = getElectronApi();
  if (!api) {
    return;
  }

  await api.invoke(EditorChannels.TAB_DELETE, payload);
}

export function firstGroup(session: EditorSessionClientDTO | null): EditorGroupClientDTO | null {
  return session?.groups[0] ?? null;
}
