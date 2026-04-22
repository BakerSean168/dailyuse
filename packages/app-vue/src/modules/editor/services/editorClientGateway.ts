import { ProjectType, type EditorGroupClientDTO, type EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import { getEditorRuntimeService } from './editorServiceRuntime';

export interface EditorContentReadResult {
  resourceId: string;
  name: string;
  content: string | null;
}

export interface EditorWorkspaceResult {
  id: string;
  name?: string | null;
  projectPath?: string | null;
}

function getService() {
  return getEditorRuntimeService();
}

export async function listEditorWorkspaces(): Promise<EditorWorkspaceResult[]> {
  const result = await getService().listWorkspaces();
  return result.ok && Array.isArray(result.data) ? result.data : [];
}

export async function createEditorWorkspace(workspaceId: string): Promise<EditorWorkspaceResult | null> {
  const result = await getService().createWorkspace({
    name: workspaceId,
    projectPath: workspaceId,
    projectType: ProjectType.Other,
  });

  return result.ok ? (result.data ?? null) : null;
}

export async function getEditorWorkspace(workspaceId: string): Promise<EditorWorkspaceResult | null> {
  const result = await getService().getWorkspace(workspaceId);
  return result.ok ? (result.data ?? null) : null;
}

export async function ensureEditorWorkspace(workspaceId: string): Promise<EditorWorkspaceResult | null> {
  const direct = await getEditorWorkspace(workspaceId);
  if (direct) {
    return direct;
  }

  const existing = (await listEditorWorkspaces()).find(
    (workspace) => workspace.projectPath === workspaceId,
  );
  if (existing) {
    return existing;
  }

  return createEditorWorkspace(workspaceId);
}

export async function listEditorSessions(workspaceId: string): Promise<EditorSessionClientDTO[]> {
  const result = await getService().listSessions(workspaceId);
  return result.ok && Array.isArray(result.data) ? result.data : [];
}

export async function createEditorSession(
  workspaceId: string,
  name: string,
): Promise<EditorSessionClientDTO | null> {
  const result = await getService().createSession({ workspaceId, name });
  return result.ok ? (result.data ?? null) : null;
}

export async function createEditorTab(payload: {
  workspaceId: string;
  sessionId: string;
  groupId: string;
  resourceId: string;
  title: string;
}) {
  const result = await getService().createTab({
    workspaceId: payload.workspaceId,
    sessionId: payload.sessionId,
    groupId: payload.groupId,
    resourceId: payload.resourceId,
    title: payload.title,
    tabIndex: 0,
    tabType: 'Resource',
  });

  return result.ok ? (result.data ?? null) : null;
}

export async function activateEditorTab(payload: {
  workspaceId: string;
  sessionId: string;
  groupId: string;
  tabId: string;
}): Promise<void> {
  await getService().activateTab(
    payload.workspaceId,
    payload.sessionId,
    payload.groupId,
    payload.tabId,
  );
}

export async function deleteEditorTab(payload: {
  workspaceId: string;
  sessionId: string;
  groupId: string;
  tabId: string;
}): Promise<void> {
  await getService().deleteTab(
    payload.workspaceId,
    payload.sessionId,
    payload.groupId,
    payload.tabId,
  );
}

export async function updateEditorTab(payload: {
  workspaceId: string;
  sessionId: string;
  groupId: string;
  tabId: string;
  isDirty?: boolean;
  title?: string;
  isPinned?: boolean;
}) {
  const result = await getService().updateTab(payload.tabId, {
    workspaceId: payload.workspaceId,
    sessionId: payload.sessionId,
    groupId: payload.groupId,
    title: payload.title,
    isPinned: payload.isPinned,
    isDirty: payload.isDirty,
  });

  return result.ok ? (result.data ?? null) : null;
}

export async function getEditorContent(resourceId: string): Promise<EditorContentReadResult | null> {
  const result = await getService().getContent(resourceId);
  return result.ok ? (result.data ?? null) : null;
}

export async function saveEditorContent(payload: {
  resourceId: string;
  content: string;
}): Promise<boolean> {
  const result = await getService().saveContent(payload.resourceId, { content: payload.content });
  return Boolean(result.ok);
}

export async function autoSaveEditorContent(payload: {
  resourceId: string;
  content: string;
}): Promise<boolean> {
  const result = await getService().autoSaveContent(payload.resourceId, { content: payload.content });
  return Boolean(result.ok);
}

export function firstGroup(session: EditorSessionClientDTO | null): EditorGroupClientDTO | null {
  return session?.groups[0] ?? null;
}
