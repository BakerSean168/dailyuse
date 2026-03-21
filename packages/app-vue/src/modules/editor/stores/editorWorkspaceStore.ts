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
  createEditorWorkspace,
  getEditorWorkspace,
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
    async setWorkspace(workspaceId: string | null) {
      if (!workspaceId) {
        this.reset();
        return;
      }

      if (this.workspaceId === workspaceId && this.isHydrated) {
        return;
      }

      this.workspaceId = workspaceId;

      let workspace = await getEditorWorkspace(workspaceId);
      if (!workspace) {
        await createEditorWorkspace(workspaceId);
        workspace = await getEditorWorkspace(workspaceId);
      }

      const sessions = await listEditorSessions(workspaceId);
      this.setSessions(sessions);

      if (this.sessions.length === 0 && workspace) {
        const created = await createEditorSession(workspaceId, 'Main');
        if (created) {
          this.setSessions([created]);
        }
      }
    },
    async openResource(params: OpenEditorResourceParams) {
      const workspaceId = params.workspaceId ?? this.workspaceId;
      if (!workspaceId) {
        return null;
      }

      await this.setWorkspace(workspaceId);
      const existingTab = findTabByResourceId(this.sessions, params.resourceId);
      if (existingTab) {
        await this.setActiveTab(existingTab.id);
        return existingTab;
      }

      const session = this.activeSession;
      const group = firstGroup(session);
      if (!session || !group) {
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
        return null;
      }

      await this.setWorkspace(workspaceId);
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
        await this.setWorkspace(this.workspaceId);
        return;
      }
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
