/**
 * Editor Workspace Orchestrator
 *
 * Gateway orchestration extracted from useEditorWorkspaceStore.
 * Handles the workflow of calling editor-client-gateway services
 * and updating store state. The store itself only holds state,
 * getters, and minimal mutations.
 */

import type { EditorSessionClientDTO, EditorTabClientDTO } from '@dailyuse/contracts/editor';
import {
  listEditorSessions,
  createEditorSession,
  createEditorTab,
  activateEditorTab,
  deleteEditorTab,
  updateEditorTab,
  firstGroup,
  ensureEditorWorkspace,
} from './editor-client-gateway';
import { findTabByResourceId, findTabLocation } from '../stores/workspace-helpers';
import type { EditorWorkspaceState } from '../stores/editor-workspace-store';

/**
 * Minimal store interface consumed by the orchestrator.
 * This decouples the orchestrator from the concrete Pinia store type.
 */
export interface EditorWorkspaceStoreView {
  // State (read)
  workspaceId: string | null;
  workspaceLookupId: string | null;
  sessions: EditorSessionClientDTO[];
  activeSessionId: string | null;
  isHydrated: boolean;
  // Getters (read)
  activeSession: EditorSessionClientDTO | null;
  openTabs: EditorTabClientDTO[];
  activeTab: EditorTabClientDTO | null;
  activeTabId: string | null;
  activeResourceId: string | null;
  // Mutations (write)
  $patch(partial: Partial<EditorWorkspaceState>): void;
  setSessions(sessions: EditorSessionClientDTO[]): void;
  upsertSession(session: EditorSessionClientDTO): void;
}

interface OpenEditorResourceParams {
  resourceId: string;
  title: string;
  workspaceId?: string | null;
}

interface WorkspaceTransition {
  key: string;
  promise: Promise<void>;
}

const workspaceTransitions = new WeakMap<object, WorkspaceTransition>();

export async function orchestrateReloadSessions(
  store: EditorWorkspaceStoreView,
  resolvedWorkspaceId?: string | null,
): Promise<void> {
  const targetWorkspaceId = resolvedWorkspaceId ?? store.workspaceId;
  if (!targetWorkspaceId) {
    return;
  }
  const sessions = await listEditorSessions(targetWorkspaceId);
  store.setSessions(sessions);

  if (store.sessions.length === 0) {
    const created = await createEditorSession(targetWorkspaceId, 'Main');
    if (created) {
      store.setSessions([created]);
    } else {
      console.warn('[EditorWorkspaceStore] reloadWorkspaceSessions:create-default-session-failed', {
        workspaceId: targetWorkspaceId,
      });
    }
  }

  if (store.sessions.length > 0 && !store.activeSession) {
    store.$patch({ activeSessionId: store.sessions[0]?.id ?? null });
  }
}

export async function orchestrateSetWorkspace(
  store: EditorWorkspaceStoreView,
  workspaceId: string | null,
  forceReload = false,
): Promise<void> {
  const transitionKey = `${workspaceId ?? 'null'}:${forceReload ? 'reload' : 'reuse'}`;
  const activeTransition = workspaceTransitions.get(store);
  if (activeTransition?.key === transitionKey) {
    await activeTransition.promise;
    return;
  }

  const transition = (activeTransition?.promise.catch(() => undefined) ?? Promise.resolve()).then(
    () => performSetWorkspace(store, workspaceId, forceReload),
  );
  workspaceTransitions.set(store, { key: transitionKey, promise: transition });

  try {
    await transition;
  } finally {
    if (workspaceTransitions.get(store)?.promise === transition) {
      workspaceTransitions.delete(store);
    }
  }
}

async function performSetWorkspace(
  store: EditorWorkspaceStoreView,
  workspaceId: string | null,
  forceReload: boolean,
): Promise<void> {
  const currentWorkspaceId = store.workspaceId;
  const hasUsableSession = store.sessions.length > 0 && store.activeSession !== null;

  if (!workspaceId) {
    store.$patch({
      workspaceId: null,
      workspaceLookupId: null,
      sessions: [],
      activeSessionId: null,
      isHydrated: false,
    });
    return;
  }

  if (
    store.workspaceLookupId === workspaceId &&
    store.isHydrated &&
    hasUsableSession &&
    !forceReload
  ) {
    return;
  }

  const workspace = await ensureEditorWorkspace(workspaceId);
  if (!workspace) {
    console.warn('[EditorWorkspaceStore] setWorkspace:ensure-workspace-failed', { workspaceId });
    store.$patch({
      workspaceId: null,
      workspaceLookupId: null,
      sessions: [],
      activeSessionId: null,
      isHydrated: false,
    });
    return;
  }

  if (currentWorkspaceId === workspace.id && store.isHydrated && hasUsableSession && !forceReload) {
    store.$patch({
      workspaceLookupId: workspaceId,
      workspaceId: workspace.id,
    });
    return;
  }

  store.$patch({
    workspaceLookupId: workspaceId,
    workspaceId: workspace.id,
  });
  await orchestrateReloadSessions(store, workspace.id);
}

export async function orchestrateOpenResource(
  store: EditorWorkspaceStoreView,
  params: OpenEditorResourceParams,
): Promise<EditorTabClientDTO | null> {
  const requestedWorkspaceId = params.workspaceId ?? store.workspaceId;

  if (!requestedWorkspaceId) {
    console.warn('[EditorWorkspaceStore] openResource:missing-workspace', {
      resourceId: params.resourceId,
    });
    return null;
  }

  await orchestrateSetWorkspace(store, requestedWorkspaceId);
  const workspaceId = store.workspaceId;
  if (!workspaceId) {
    console.warn('[EditorWorkspaceStore] openResource:missing-resolved-workspace', {
      resourceId: params.resourceId,
      requestedWorkspaceId,
    });
    return null;
  }

  const existingTab = findTabByResourceId(store.sessions, params.resourceId);
  if (existingTab) {
    await orchestrateSetActiveTab(store, existingTab.id);
    return existingTab;
  }

  const session = store.activeSession;
  const group = firstGroup(session);
  if (!session || !group) {
    console.warn('[EditorWorkspaceStore] openResource:no-session-or-group', {
      resourceId: params.resourceId,
      workspaceId: requestedWorkspaceId,
      resolvedWorkspaceId: store.workspaceId,
      hasSession: Boolean(session),
      hasGroup: Boolean(group),
      sessionCount: store.sessions.length,
      activeSessionId: store.activeSessionId,
    });
    return null;
  }
  const created = await createEditorTab({
    workspaceId,
    sessionId: session.id,
    groupId: group.id,
    resourceId: params.resourceId,
    title: params.title,
  });

  if (!created) {
    console.warn('[EditorWorkspaceStore] openResource:create-tab-failed', {
      resourceId: params.resourceId,
      workspaceId,
      sessionId: session.id,
      groupId: group.id,
    });
    return null;
  }

  await orchestrateReloadSessions(store, workspaceId);
  const refreshed = findTabByResourceId(store.sessions, params.resourceId);
  if (refreshed) {
    await orchestrateSetActiveTab(store, refreshed.id);
  }
  return refreshed;
}

export async function orchestrateSetTabPinned(
  store: EditorWorkspaceStoreView,
  tabId: string,
  isPinned: boolean,
): Promise<EditorTabClientDTO | null> {
  const location = findTabLocation(store.sessions, tabId);
  if (!location || !store.workspaceId) {
    return null;
  }

  if (location.tab.isPinned === isPinned) {
    return location.tab;
  }

  const updated = await updateEditorTab({
    workspaceId: store.workspaceId,
    sessionId: location.session.id,
    groupId: location.group.id,
    tabId,
    isPinned,
  });

  if (!updated) {
    return null;
  }

  location.tab.isPinned = updated.isPinned;
  location.tab.updatedAt = updated.updatedAt;
  location.tab.formattedUpdatedAt = updated.formattedUpdatedAt;
  return location.tab;
}

export async function orchestrateSetActiveTab(
  store: EditorWorkspaceStoreView,
  tabId: string,
): Promise<void> {
  if (store.activeTabId === tabId) {
    return;
  }

  for (const session of store.sessions) {
    const group = session.groups.find((item) => item.tabs.some((tab) => tab.id === tabId));
    const tab = group?.tabs.find((item) => item.id === tabId);
    if (!group || !tab || !store.workspaceId) {
      continue;
    }
    await activateEditorTab({
      workspaceId: store.workspaceId,
      sessionId: session.id,
      groupId: group.id,
      tabId,
    });
    await orchestrateReloadSessions(store, store.workspaceId);
    return;
  }

  console.warn('[EditorWorkspaceStore] setActiveTab:tab-not-found', {
    tabId,
    workspaceId: store.workspaceId,
    sessionCount: store.sessions.length,
  });
}

export async function orchestrateCloseTab(
  store: EditorWorkspaceStoreView,
  tabId: string,
): Promise<void> {
  for (const session of store.sessions) {
    const group = session.groups.find((item) => item.tabs.some((tab) => tab.id === tabId));
    if (!group || !store.workspaceId) {
      continue;
    }

    await deleteEditorTab({
      workspaceId: store.workspaceId,
      sessionId: session.id,
      groupId: group.id,
      tabId,
    });
    await orchestrateReloadSessions(store, store.workspaceId);
    return;
  }
}

export async function orchestrateSyncTabDirtyState(
  store: EditorWorkspaceStoreView,
  tabId: string,
  isDirty: boolean,
): Promise<EditorTabClientDTO | null> {
  const location = findTabLocation(store.sessions, tabId);
  if (!location || !store.workspaceId) {
    return null;
  }

  if (location.tab.isDirty === isDirty) {
    return location.tab;
  }

  const updated = await updateEditorTab({
    workspaceId: store.workspaceId,
    sessionId: location.session.id,
    groupId: location.group.id,
    tabId,
    isDirty,
  });

  if (!updated) {
    return null;
  }

  location.tab.isDirty = updated.isDirty;
  location.tab.updatedAt = updated.updatedAt;
  location.tab.formattedUpdatedAt = updated.formattedUpdatedAt;
  return location.tab;
}
