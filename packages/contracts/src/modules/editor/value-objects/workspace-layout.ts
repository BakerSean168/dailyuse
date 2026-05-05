/**
 * Workspace Layout Value Object
 */

// ============ Interface Definitions ============

/** Workspace Layout interface. */
export interface IWorkspaceLayout {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;

  // Value object methods
  with(
    updates: Partial<
      Omit<IWorkspaceLayout, 'equals' | 'with' | 'toDTO'>
    >,
  ): IWorkspaceLayout;

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Workspace Layout DTO
 */
export interface WorkspaceLayoutDTO {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;
}

// ============ Defaults ============

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayoutDTO = {
  sidebarPosition: 'Left',
  sidebarWidth: 300,
  panelPosition: 'Bottom',
  panelHeight: 200,
  isSidebarVisible: true,
  isPanelVisible: false,
};
