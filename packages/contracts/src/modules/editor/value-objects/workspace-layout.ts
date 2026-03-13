/**
 * Workspace Layout Value Object
 */

// ============ Interface Definitions ============

/** Workspace Layout - Server interface. */
export interface IWorkspaceLayoutServer {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IWorkspaceLayoutServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IWorkspaceLayoutServer;

  // DTO conversion methods
}

/** Workspace Layout - Client interface. */
export interface IWorkspaceLayoutClient {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Workspace Layout Server DTO
 */
export interface WorkspaceLayoutServerDTO {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;
}

/**
 * Workspace Layout Client DTO
 */
export interface WorkspaceLayoutClientDTO {
  sidebarPosition: 'Left' | 'Right';
  sidebarWidth: number;
  panelPosition: 'Bottom' | 'Right';
  panelHeight: number;
  isSidebarVisible: boolean;
  isPanelVisible: boolean;
}

/**
 * Workspace Layout Persistence DTO
 */
export interface WorkspaceLayoutPersistenceDTO {
  sidebar_position: 'Left' | 'Right';
  sidebar_width: number;
  panel_position: 'Bottom' | 'Right';
  panel_height: number;
  is_sidebar_visible: boolean;
  is_panel_visible: boolean;
}

// ============ Type Exports ============

export type WorkspaceLayoutServer = IWorkspaceLayoutServer;
export type WorkspaceLayoutClient = IWorkspaceLayoutClient;

// ============ Defaults ============

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayoutServerDTO = {
  sidebarPosition: 'Left',
  sidebarWidth: 300,
  panelPosition: 'Bottom',
  panelHeight: 200,
  isSidebarVisible: true,
  isPanelVisible: false,
};
