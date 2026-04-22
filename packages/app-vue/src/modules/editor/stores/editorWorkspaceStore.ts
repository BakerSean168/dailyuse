import { defineStore } from 'pinia';
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
} from '../services/editorClientGateway';

export interface EditorWorkspaceState {
  workspaceId: string | null;
  workspaceLookupId: string | null;
  sessions: EditorSessionClientDTO[];
  activeSessionId: string | null;
  isHydrated: boolean;
}

interface OpenEditorResourceParams {
  resourceId: string;
  title: string;
  workspaceId?: string | null;
}

function findTabByResourceId(
  sessions: EditorSessionClientDTO[],
  resourceId: string,
): EditorTabClientDTO | null {
  for (const session of sessions) {
    for (const group of session.groups) {
      const tab = group.tabs.find((item) => item.resourceId === resourceId);
      if (tab) {
        return tab;
      }
    }
  }

  return null;
}

function findTabLocation(
  sessions: EditorSessionClientDTO[],
  tabId: string,
): {
  session: EditorSessionClientDTO;
  group: EditorSessionClientDTO['groups'][number];
  tab: EditorTabClientDTO;
} | null {
  for (const session of sessions) {
    for (const group of session.groups) {
      const tab = group.tabs.find((item) => item.id === tabId);
      if (tab) {
        return { session, group, tab };
      }
    }
  }

  return null;
}

export const useEditorWorkspaceStore = defineStore('editor-workspace', {
  state: (): EditorWorkspaceState => ({
    workspaceId: null,
    workspaceLookupId: null,
    sessions: [],
    activeSessionId: null,
    isHydrated: false,
  }),

  getters: {
    activeSession(state): EditorSessionClientDTO | null {
      return state.sessions.find((session) => session.id === state.activeSessionId) ?? null;
    },
    openTabs(): EditorTabClientDTO[] {
      return this.activeSession?.groups.flatMap((group) => group.tabs) ?? [];
    },
    activeTab(): EditorTabClientDTO | null {
      const session = this.activeSession;
      if (!session) {
        return null;
      }

      const activeGroup = session.groups[session.activeGroupIndex];
      if (!activeGroup) {
        return null;
      }

      return activeGroup.tabs[activeGroup.activeTabIndex] ?? null;
    },
    activeTabId(): string | null {
      return this.activeTab?.id ?? null;
    },
    activeResourceId(): string | null {
      return this.activeTab?.resourceId ?? null;
    },
  },

  actions: {
    reset() {
      this.workspaceId = null;
      this.workspaceLookupId = null;
      this.sessions = [];
      this.activeSessionId = null;
      this.isHydrated = false;
    },
    setSessions(sessions: EditorSessionClientDTO[]) {
      this.sessions = sessions;
      const active = sessions.find((session) => session.isActive) ?? sessions[0] ?? null;
      this.activeSessionId = active?.id ?? null;
      this.isHydrated = true;
    },
    upsertSession(session: EditorSessionClientDTO) {
      const index = this.sessions.findIndex((item) => item.id === session.id);
      if (index >= 0) {
        this.sessions.splice(index, 1, session);
      } else {
        this.sessions.push(session);
      }

      if (session.isActive || !this.activeSessionId) {
        this.activeSessionId = session.id;
      }
    },
    async reloadWorkspaceSessions(resolvedWorkspaceId?: string | null) {
      const targetWorkspaceId = resolvedWorkspaceId ?? this.workspaceId;
      if (!targetWorkspaceId) {
        return;
      }
      const sessions = await listEditorSessions(targetWorkspaceId);
      this.setSessions(sessions);

      if (this.sessions.length === 0) {
        const created = await createEditorSession(targetWorkspaceId, 'Main');
        if (created) {
          this.setSessions([created]);
        } else {
          console.warn('[EditorWorkspaceStore] reloadWorkspaceSessions:create-default-session-failed', {
            workspaceId: targetWorkspaceId,
          });
        }
      }

      if (this.sessions.length > 0 && !this.activeSession) {
        this.activeSessionId = this.sessions[0]?.id ?? null;
      }
    },
    async setWorkspace(workspaceId: string | null, forceReload = false) {
      const currentWorkspaceId = this.workspaceId;
      const currentWorkspaceLookupId = this.workspaceLookupId;
      const hasUsableSession = this.sessions.length > 0 && this.activeSession !== null;

      if (!workspaceId) {
        this.reset();
        return;
      }

      if (
        this.workspaceLookupId === workspaceId &&
        this.isHydrated &&
        hasUsableSession &&
        !forceReload
      ) {
        return;
      }

      const workspace = await ensureEditorWorkspace(workspaceId);
      if (!workspace) {
        console.warn('[EditorWorkspaceStore] setWorkspace:ensure-workspace-failed', { workspaceId });
        this.reset();
        return;
      }

      if (currentWorkspaceId === workspace.id && this.isHydrated && hasUsableSession && !forceReload) {
        this.workspaceLookupId = workspaceId;
        this.workspaceId = workspace.id;
        return;
      }

      this.workspaceLookupId = workspaceId;
      this.workspaceId = workspace.id;
      await this.reloadWorkspaceSessions(workspace.id);
    },
    async openResource(params: OpenEditorResourceParams) {
      const requestedWorkspaceId = params.workspaceId ?? this.workspaceId;

      if (!requestedWorkspaceId) {
        console.warn('[EditorWorkspaceStore] openResource:missing-workspace', {
          resourceId: params.resourceId,
        });
        return null;
      }

      await this.setWorkspace(requestedWorkspaceId);
      const workspaceId = this.workspaceId;
      if (!workspaceId) {
        console.warn('[EditorWorkspaceStore] openResource:missing-resolved-workspace', {
          resourceId: params.resourceId,
          requestedWorkspaceId,
        });
        return null;
      }

      const existingTab = findTabByResourceId(this.sessions, params.resourceId);
      if (existingTab) {
        await this.setActiveTab(existingTab.id);
        return existingTab;
      }

      const session = this.activeSession;
      const group = firstGroup(session);
      if (!session || !group) {
        console.warn('[EditorWorkspaceStore] openResource:no-session-or-group', {
          resourceId: params.resourceId,
          workspaceId: requestedWorkspaceId,
          resolvedWorkspaceId: this.workspaceId,
          hasSession: Boolean(session),
          hasGroup: Boolean(group),
          sessionCount: this.sessions.length,
          activeSessionId: this.activeSessionId,
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

      await this.reloadWorkspaceSessions(workspaceId);
      const refreshed = findTabByResourceId(this.sessions, params.resourceId);
      if (refreshed) {
        await this.setActiveTab(refreshed.id);
      }
      return refreshed;
    },
    async setTabPinned(tabId: string, isPinned: boolean) {
      const location = findTabLocation(this.sessions, tabId);
      if (!location || !this.workspaceId) {
        return null;
      }

      if (location.tab.isPinned === isPinned) {
        return location.tab;
      }

      const updated = await updateEditorTab({
        workspaceId: this.workspaceId,
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
    },
    async setActiveTab(tabId: string) {
      if (this.activeTabId === tabId) {
        return;
      }

      for (const session of this.sessions) {
        const group = session.groups.find((item) => item.tabs.some((tab) => tab.id === tabId));
        const tab = group?.tabs.find((item) => item.id === tabId);
        if (!group || !tab || !this.workspaceId) {
          continue;
        }
        await activateEditorTab({
          workspaceId: this.workspaceId,
          sessionId: session.id,
          groupId: group.id,
          tabId,
        });
        await this.reloadWorkspaceSessions(this.workspaceId);
        return;
      }

      console.warn('[EditorWorkspaceStore] setActiveTab:tab-not-found', {
        tabId,
        workspaceId: this.workspaceId,
        sessionCount: this.sessions.length,
      });
    },
    async closeTab(tabId: string) {
      for (const session of this.sessions) {
        const group = session.groups.find((item) => item.tabs.some((tab) => tab.id === tabId));
        if (!group || !this.workspaceId) {
          continue;
        }

        await deleteEditorTab({
          workspaceId: this.workspaceId,
          sessionId: session.id,
          groupId: group.id,
          tabId,
        });
        await this.reloadWorkspaceSessions(this.workspaceId);
        return;
      }
    },
    async closeOtherTabs(tabId: string) {
      const otherTabs = this.openTabs.filter((tab) => tab.id !== tabId);
      for (const tab of otherTabs) {
        await this.closeTab(tab.id);
      }
    },
    async closeTabsToRight(tabId: string) {
      const tabs = this.openTabs;
      const index = tabs.findIndex((tab) => tab.id === tabId);
      if (index < 0) {
        return;
      }

      for (const tab of tabs.slice(index + 1)) {
        await this.closeTab(tab.id);
      }
    },
    async closeAllTabs() {
      for (const tab of [...this.openTabs]) {
        await this.closeTab(tab.id);
      }
    },
    async syncTabDirtyState(tabId: string, isDirty: boolean) {
      const location = findTabLocation(this.sessions, tabId);
      if (!location || !this.workspaceId) {
        return null;
      }

      if (location.tab.isDirty === isDirty) {
        return location.tab;
      }

      const updated = await updateEditorTab({
        workspaceId: this.workspaceId,
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
    },
    findTabByResourceId(resourceId: string): EditorTabClientDTO | null {
      return findTabByResourceId(this.sessions, resourceId);
    },
  },

  persist: {
    pick: ['workspaceId', 'workspaceLookupId', 'activeSessionId'] as string[],
  },
});
