import { EditorChannels } from '@dailyuse/contracts/electron';
import type {
  EditorSessionClientDTO,
  EditorTabClientDTO,
  EditorGroupClientDTO,
} from '@dailyuse/contracts/editor';

interface EditorContentReadResult {
  resourceId: string;
  name: string;
  content: string | null;
}

function getElectronApi() {
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
}

export async function createEditorWorkspace(workspaceId: string): Promise<boolean> {
  const api = getElectronApi();
  if (!api) {
    return false;
  }

  const result = (await api.invoke(EditorChannels.WORKSPACE_CREATE, {
    workspaceId,
  })) as { ok?: boolean };

  return Boolean(result?.ok);
}

export async function getEditorWorkspace(workspaceId: string): Promise<{ id: string } | null> {
  const api = getElectronApi();
  if (!api) {
    return null;
  }

  const result = (await api.invoke(EditorChannels.WORKSPACE_GET, workspaceId)) as {
    ok?: boolean;
    data?: { id: string } | null;
  };

  return result?.ok ? (result.data ?? null) : null;
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

export async function updateEditorTab(payload: {
  workspaceId: string;
  sessionId: string;
  groupId: string;
  tabId: string;
  isDirty?: boolean;
  title?: string;
  isPinned?: boolean;
}): Promise<EditorTabClientDTO | null> {
  const api = getElectronApi();
  if (!api) {
    return null;
  }

  const result = (await api.invoke(EditorChannels.TAB_UPDATE, {
    tabId: payload.tabId,
    data: {
      workspaceId: payload.workspaceId,
      sessionId: payload.sessionId,
      groupId: payload.groupId,
      title: payload.title,
      isPinned: payload.isPinned,
      isDirty: payload.isDirty,
    },
  })) as { ok?: boolean; data?: EditorTabClientDTO | null };

  return result?.ok ? (result.data ?? null) : null;
}

export async function getEditorContent(
  resourceId: string,
): Promise<EditorContentReadResult | null> {
  const api = getElectronApi();
  if (!api) {
    return null;
  }

  const result = (await api.invoke(EditorChannels.GET_CONTENT, resourceId)) as {
    ok?: boolean;
    data?: EditorContentReadResult | null;
  };

  return result?.ok ? (result.data ?? null) : null;
}

export async function saveEditorContent(payload: {
  resourceId: string;
  content: string;
}): Promise<boolean> {
  const api = getElectronApi();
  if (!api) {
    return false;
  }

  const result = (await api.invoke(EditorChannels.SAVE_CONTENT, payload)) as {
    ok?: boolean;
  };

  return Boolean(result?.ok);
}

export async function autoSaveEditorContent(payload: {
  resourceId: string;
  content: string;
}): Promise<boolean> {
  const api = getElectronApi();
  if (!api) {
    return false;
  }

  const result = (await api.invoke(EditorChannels.AUTO_SAVE, payload)) as {
    ok?: boolean;
  };

  return Boolean(result?.ok);
}

export function firstGroup(session: EditorSessionClientDTO | null): EditorGroupClientDTO | null {
  return session?.groups[0] ?? null;
}
