import { defineStore } from 'pinia';

export type EditorWorkspaceSidebarMode = 'files' | 'search' | 'bookmarks';

interface EditorWorkspaceUiState {
  sidebarMode: EditorWorkspaceSidebarMode;
  sidebarCollapsed: boolean;
}

export const useEditorWorkspaceUiStore = defineStore('editor-workspace-ui', {
  state: (): EditorWorkspaceUiState => ({
    sidebarMode: 'files',
    sidebarCollapsed: false,
  }),

  actions: {
    setSidebarMode(mode: EditorWorkspaceSidebarMode) {
      this.sidebarMode = mode;
    },
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed;
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
  },

  persist: {
    pick: ['sidebarMode', 'sidebarCollapsed'] as string[],
  },
});
