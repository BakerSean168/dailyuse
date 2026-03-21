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
} from '../services/editorDesktop.service';

export interface EditorWorkspaceState {
  workspaceId: string | null;
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
    async setWorkspace(workspaceId: string | null, forceReload = false) {
      const currentWorkspaceId = this.workspaceId;
      const hasUsableSession = this.sessions.length > 0 && this.activeSession !== null;

      console.info('[EditorWorkspaceStore] setWorkspace:start', {
        nextWorkspaceId: workspaceId,
        currentWorkspaceId,
        isHydrated: this.isHydrated,
        sessionCount: this.sessions.length,
        activeSessionId: this.activeSessionId,
        forceReload,
      });

      if (!workspaceId) {
        console.info('[EditorWorkspaceStore] setWorkspace:reset');
        this.reset();
        return;
      }

      if (this.workspaceId === workspaceId && this.isHydrated && hasUsableSession && !forceReload) {
        console.info('[EditorWorkspaceStore] setWorkspace:skip-rehydrate', {
          workspaceId,
          activeSessionId: this.activeSessionId,
          sessionCount: this.sessions.length,
        });
        return;
      }

      console.info('[EditorWorkspaceStore] setWorkspace:load-workspace', { workspaceId });
      const workspace = await ensureEditorWorkspace(workspaceId);
      if (!workspace) {
        console.warn('[EditorWorkspaceStore] setWorkspace:ensure-workspace-failed', { workspaceId });
        this.reset();
        return;
      }

      if (currentWorkspaceId === workspace.id && this.isHydrated && hasUsableSession && !forceReload) {
        this.workspaceId = workspace.id;
        console.info('[EditorWorkspaceStore] setWorkspace:skip-rehydrate-resolved', {
          requestedWorkspaceId: workspaceId,
          resolvedWorkspaceId: workspace.id,
          activeSessionId: this.activeSessionId,
          sessionCount: this.sessions.length,
        });
        return;
      }

      this.workspaceId = workspace.id;

      console.info('[EditorWorkspaceStore] setWorkspace:list-sessions', {
        requestedWorkspaceId: workspaceId,
        resolvedWorkspaceId: workspace.id,
      });
      const sessions = await listEditorSessions(workspace.id);
      this.setSessions(sessions);

      if (this.sessions.length === 0) {
        console.info('[EditorWorkspaceStore] setWorkspace:create-default-session', {
          requestedWorkspaceId: workspaceId,
          resolvedWorkspaceId: workspace.id,
          workspaceIdFromStore: this.workspaceId,
          workspaceFound: Boolean(workspace),
        });
        const created = await createEditorSession(workspace.id, 'Main');
        if (created) {
          this.setSessions([created]);
        } else {
          console.warn('[EditorWorkspaceStore] setWorkspace:create-default-session-failed', {
            requestedWorkspaceId: workspaceId,
            resolvedWorkspaceId: workspace.id,
            workspaceFound: Boolean(workspace),
          });
        }
      }

      if (this.sessions.length > 0 && !this.activeSession) {
        this.activeSessionId = this.sessions[0]?.id ?? null;
        console.info('[EditorWorkspaceStore] setWorkspace:recover-active-session', {
          workspaceId,
          activeSessionId: this.activeSessionId,
        });
      }

      console.info('[EditorWorkspaceStore] setWorkspace:done', {
        requestedWorkspaceId: workspaceId,
        resolvedWorkspaceId: this.workspaceId,
        sessionCount: this.sessions.length,
        activeSessionId: this.activeSessionId,
      });
    },
    async openResource(params: OpenEditorResourceParams) {
      const requestedWorkspaceId = params.workspaceId ?? this.workspaceId;
      console.info('[EditorWorkspaceStore] openResource:start', {
        resourceId: params.resourceId,
        title: params.title,
        workspaceId: requestedWorkspaceId,
        storeWorkspaceId: this.workspaceId,
        sessionCount: this.sessions.length,
        activeSessionId: this.activeSessionId,
      });

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
        console.info('[EditorWorkspaceStore] openResource:activate-existing-tab', {
          resourceId: params.resourceId,
          tabId: existingTab.id,
        });
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

      console.info('[EditorWorkspaceStore] openResource:create-tab', {
        resourceId: params.resourceId,
        sessionId: session.id,
        groupId: group.id,
      });
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

      await this.setWorkspace(workspaceId, true);
      const refreshed = findTabByResourceId(this.sessions, params.resourceId);
      if (refreshed) {
        console.info('[EditorWorkspaceStore] openResource:activate-refreshed-tab', {
          resourceId: params.resourceId,
          tabId: refreshed.id,
        });
        await this.setActiveTab(refreshed.id);
      }

      console.info('[EditorWorkspaceStore] openResource:done', {
        resourceId: params.resourceId,
        openedTabId: refreshed?.id ?? created.id,
      });
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
      console.info('[EditorWorkspaceStore] setActiveTab:start', {
        tabId,
        workspaceId: this.workspaceId,
        sessionCount: this.sessions.length,
      });

      for (const session of this.sessions) {
        const group = session.groups.find((item) => item.tabs.some((tab) => tab.id === tabId));
        const tab = group?.tabs.find((item) => item.id === tabId);
        if (!group || !tab || !this.workspaceId) {
          continue;
        }

        console.info('[EditorWorkspaceStore] setActiveTab:activate', {
          tabId,
          sessionId: session.id,
          groupId: group.id,
          workspaceId: this.workspaceId,
        });
        await activateEditorTab({
          workspaceId: this.workspaceId,
          sessionId: session.id,
          groupId: group.id,
          tabId,
        });
        await this.setWorkspace(this.workspaceId);
        console.info('[EditorWorkspaceStore] setActiveTab:done', {
          tabId,
          workspaceId: this.workspaceId,
        });
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
        await this.setWorkspace(this.workspaceId);
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
    pick: ['workspaceId', 'activeSessionId'] as string[],
  },
});
