import { defineStore } from 'pinia';
import type { EditorSessionClientDTO, EditorTabClientDTO } from '@dailyuse/contracts/editor';
import { findTabByResourceId } from './workspace-helpers';
import {
  orchestrateReloadSessions,
  orchestrateSetWorkspace,
  orchestrateOpenResource,
  orchestrateSetTabPinned,
  orchestrateSetActiveTab,
  orchestrateCloseTab,
  orchestrateSyncTabDirtyState,
} from '../services/editor-workspace-orchestrator';

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
      await orchestrateReloadSessions(this, resolvedWorkspaceId);
    },
    async setWorkspace(workspaceId: string | null, forceReload = false) {
      await orchestrateSetWorkspace(this, workspaceId, forceReload);
    },
    async openResource(params: OpenEditorResourceParams) {
      return orchestrateOpenResource(this, params);
    },
    async setTabPinned(tabId: string, isPinned: boolean) {
      return orchestrateSetTabPinned(this, tabId, isPinned);
    },
    async setActiveTab(tabId: string) {
      await orchestrateSetActiveTab(this, tabId);
    },
    async closeTab(tabId: string) {
      await orchestrateCloseTab(this, tabId);
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
      return orchestrateSyncTabDirtyState(this, tabId, isDirty);
    },
    findTabByResourceId(resourceId: string): EditorTabClientDTO | null {
      return findTabByResourceId(this.sessions, resourceId);
    },
  },

  persist: {
    pick: ['workspaceId', 'workspaceLookupId', 'activeSessionId'] as string[],
  },
});
